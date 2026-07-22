/**
 * MessageBubble — renders single message, handles delete
 */
export function createMessageBubble({ store, chatService }) {
  return function renderMessageBubble(message, { mine, avatarUrl, onDelete }) {
    const row = document.createElement("div");
    row.className = `message-row ${mine ? "mine" : "theirs"}`;

    const avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = avatarUrl || "https://i.pravatar.cc/100";
    avatar.alt = "avatar";

    const wrap = document.createElement("div");
    wrap.className = "message-bubble-wrap";

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${message.deleted ? "deleted" : ""}`;
    bubble.textContent = message.deleted ? "Message deleted" : message.content;

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const time = document.createElement("span");
    time.textContent = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    meta.appendChild(time);

    if (mine && message.type === "text" && !message.deleted) {
      const actions = document.createElement("div");
      actions.className = "message-actions";
      const delBtn = document.createElement("button");
      delBtn.className = "btn-small danger";
      delBtn.textContent = "Delete";
      delBtn.setAttribute("aria-label", "Delete message");
      delBtn.addEventListener("click", () => {
        // inline confirm
        if (wrap.querySelector(".inline-confirm")) return;
        const confirmEl = document.createElement("div");
        confirmEl.className = "inline-confirm";
        confirmEl.innerHTML = `<span>Delete this message?</span>`;
        const yes = document.createElement("button");
        yes.className = "btn-small danger";
        yes.textContent = "Yes";
        const no = document.createElement("button");
        no.className = "btn-small";
        no.textContent = "No";
        confirmEl.appendChild(yes);
        confirmEl.appendChild(no);
        wrap.appendChild(confirmEl);
        yes.addEventListener("click", async () => {
          try {
            await chatService.deleteMessage(message.id);
            store.publish("messages:changed", {
              conversationId: message.conversationId,
            });
            if (onDelete) onDelete();
          } catch (e) {
            console.error(e);
          }
        });
        no.addEventListener("click", () => confirmEl.remove());
      });
      actions.appendChild(delBtn);
      meta.appendChild(actions);
    }

    wrap.appendChild(bubble);
    wrap.appendChild(meta);

    if (!mine) {
      row.appendChild(avatar);
    }
    row.appendChild(wrap);
    if (mine) {
      // avatar on right for mine? design says row-reverse already
      row.appendChild(avatar);
    }

    return row;
  };
}
