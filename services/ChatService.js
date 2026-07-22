const MSG_KEY = "estudy_messages";
const CONV_KEY = "estudy_conversations";

function read() {
  try {
    return JSON.parse(localStorage.getItem(MSG_KEY) || "[]");
  } catch {
    return [];
  }
}
function write(arr) {
  localStorage.setItem(MSG_KEY, JSON.stringify(arr));
}

function readConvs() {
  try {
    return JSON.parse(localStorage.getItem(CONV_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeConvs(arr) {
  localStorage.setItem(CONV_KEY, JSON.stringify(arr));
}

export const ChatService = {
  getMessages(conversationId) {
    const all = read().filter((m) => m.conversationId === conversationId);
    all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return Promise.resolve(all);
  },

  sendMessage({
    conversationId,
    senderId,
    senderRole,
    type = "text",
    content,
  }) {
    const all = read();
    const msg = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      senderRole,
      type,
      content,
      timestamp: new Date().toISOString(),
      deleted: false,
    };
    all.push(msg);
    write(all);

    // update conversation unread + lastMessageAt
    const convs = readConvs();
    const conv = convs.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessageAt = msg.timestamp;
      const recipientRole = senderRole === "tutor" ? "student" : "tutor";
      if (recipientRole === "tutor")
        conv.unreadCountForTutor = (conv.unreadCountForTutor || 0) + 1;
      else conv.unreadCountForStudent = (conv.unreadCountForStudent || 0) + 1;
      writeConvs(convs);
    }

    return Promise.resolve(msg);
  },

  deleteMessage(messageId) {
    const all = read();
    const idx = all.findIndex((m) => m.id === messageId);
    if (idx === -1) return Promise.resolve(null);
    // soft delete
    all[idx].deleted = true;
    // if it was offer type, prevent delete — but UI already hides; service also guards
    if (all[idx].type === "offer") {
      return Promise.reject(new Error("Offer messages cannot be deleted"));
    }
    write(all);
    return Promise.resolve(all[idx]);
  },

  _read() {
    return read();
  },
};
