/**
 * ChatWindow — center chat, message list, input, offer action bar
 */
import { createMessageBubble } from "./MessageBubble.js";
import { createOfferCard } from "./OfferCard.js";

export function createChatWindow({
  store,
  chatService,
  offerService,
  conversationService,
  profileService,
}) {
  let container = null;
  let messages = [];
  let activeConv = null;
  let otherProfile = null;
  let pendingOffer = null;

  const bubbleRenderer = createMessageBubble({ store, chatService });
  const offerRenderer = createOfferCard({
    store,
    offerService,
    profileService,
  });

  function render() {
    if (!container) return;
    container.innerHTML = "";
    container.className = "chat-window";

    if (!activeConv) {
      const empty = document.createElement("div");
      empty.className = "empty-chat";
      empty.innerHTML = `<h3>No conversation selected</h3><p>Choose a conversation from the left panel to start chatting.</p>`;
      container.appendChild(empty);
      return;
    }

    // Offer action bar — only for tutor, and only if no pending exists, else show edit
    const state = store.getState();
    const bar = document.createElement("div");
    bar.className = "offer-action-bar";
    if (state.currentRole === "tutor") {
      if (pendingOffer) {
        const editBtn = document.createElement("button");
        editBtn.className = "primary";
        editBtn.textContent = "Edit pending offer";
        editBtn.addEventListener("click", () => {
          store.publish("ui:editOffer", pendingOffer);
        });
        bar.appendChild(editBtn);
        const info = document.createElement("span");
        info.style.fontSize = "12px";
        info.style.color = "var(--text-secondary)";
        info.style.alignSelf = "center";
        info.textContent =
          "You have a pending offer. Edit it or wait for response.";
        bar.appendChild(info);
      } else {
        const createBtn = document.createElement("button");
        createBtn.className = "primary";
        createBtn.textContent = "Create custom offer";
        createBtn.addEventListener("click", () => {
          store.publish("ui:createOffer", { conversation: activeConv });
        });
        bar.appendChild(createBtn);
      }
      container.appendChild(bar);
    }

    const list = document.createElement("div");
    list.className = "messages-container";
    list.setAttribute("aria-live", "polite");
    list.setAttribute("role", "log");

    if (messages.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-chat";
      empty.innerHTML = `<h3>No messages yet</h3><p>Start the conversation with a friendly hello.</p>`;
      list.appendChild(empty);
    } else {
      // render each
      // We'll render sequentially, but offer cards are async, so we need to handle
      for (const msg of messages) {
        const placeholder = document.createElement("div");
        placeholder.dataset.msgId = msg.id;
        list.appendChild(placeholder);
        renderSingleMessage(msg, placeholder);
      }
    }

    container.appendChild(list);

    const inputArea = document.createElement("div");
    inputArea.className = "chat-input-area";
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Type a message…";
    textarea.setAttribute("aria-label", "Message input");
    textarea.rows = 1;
    const sendBtn = document.createElement("button");
    sendBtn.className = "send-btn";
    sendBtn.textContent = "Send";
    sendBtn.disabled = true;

    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      sendBtn.disabled = !textarea.value.trim();
    });
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim()) doSend();
      }
    });
    sendBtn.addEventListener("click", doSend);

    async function doSend() {
      const text = textarea.value.trim();
      if (!text) return;
      textarea.value = "";
      sendBtn.disabled = true;
      textarea.style.height = "44px";
      try {
        await chatService.sendMessage({
          conversationId: activeConv.id,
          senderId: state.currentUserId,
          senderRole: state.currentRole,
          type: "text",
          content: text,
        });
        store.publish("messages:changed", { conversationId: activeConv.id });
        store.publish("conversations:changed", null);
      } catch (e) {
        console.error(e);
      }
    }

    inputArea.appendChild(textarea);
    inputArea.appendChild(sendBtn);
    container.appendChild(inputArea);

    // scroll to bottom
    setTimeout(() => {
      list.scrollTop = list.scrollHeight;
    }, 50);
  }

  async function renderSingleMessage(msg, placeholder) {
    const state = store.getState();
    const mine = msg.senderId === state.currentUserId;
    const avatarUrl = mine
      ? (await profileService.getProfile(state.currentUserId))?.profilePicUrl
      : otherProfile?.profilePicUrl;

    let node;
    if (msg.type === "offer") {
      node = await offerRenderer(msg, {
        mine,
        avatarUrl,
        currentRole: state.currentRole,
        onUpdate: async () => {
          await refreshMessages();
          store.publish("conversations:changed", null);
        },
      });
    } else {
      node = bubbleRenderer(msg, {
        mine,
        avatarUrl,
        onDelete: refreshMessages,
      });
      // for soft-deleted, content already handled
      if (msg.deleted) {
        node.querySelector(".message-bubble").textContent = "Message deleted";
      }
    }
    placeholder.replaceWith(node);
  }

  async function refreshMessages() {
    if (!activeConv) return;
    messages = await chatService.getMessages(activeConv.id);
    // determine pending offer
    const offers = await offerService.getOffersByConversation(activeConv.id);
    pendingOffer = offers.find((o) => o.status === "pending") || null;
    // fetch other profile for avatars
    const state = store.getState();
    const otherId =
      state.currentRole === "tutor" ? activeConv.studentId : activeConv.tutorId;
    otherProfile = await profileService.getProfile(otherId);
    render();
  }

  async function updateActive(conv) {
    activeConv = conv;
    if (!conv) {
      messages = [];
      pendingOffer = null;
      render();
      return;
    }
    await refreshMessages();
  }

  return {
    mount(el) {
      container = el;
      store.subscribe("activeConversation:changed", (conv) =>
        updateActive(conv),
      );
      store.subscribe("messages:changed", (payload) => {
        if (!activeConv) return;
        if (!payload || payload.conversationId === activeConv.id)
          refreshMessages();
      });
      store.subscribe("messages:external", () => {
        if (activeConv) refreshMessages();
      });
      store.subscribe("offers:changed", (payload) => {
        if (!activeConv) return;
        if (!payload || payload.conversationId === activeConv.id)
          refreshMessages();
      });
      store.subscribe("offers:external", () => {
        if (activeConv) refreshMessages();
      });
      render();
    },
    refresh: refreshMessages,
  };
}
