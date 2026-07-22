const KEY = 'estudy_conversations';
const MSG_KEY = 'estudy_messages';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

function readMessages() {
  try { return JSON.parse(localStorage.getItem(MSG_KEY) || '[]'); } catch { return []; }
}
function writeMessages(arr) { localStorage.setItem(MSG_KEY, JSON.stringify(arr)); }

export const ConversationService = {
  listConversations(userId, role) {
    const all = read();
    const filtered = all.filter(c => role === 'tutor' ? c.tutorId === userId : c.studentId === userId);
    filtered.sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    return Promise.resolve(filtered);
  },

  getConversation(id) {
    return Promise.resolve(read().find(c => c.id === id) || null);
  },

  deleteConversation(id) {
    // Must NOT cascade to offers — only conversations + messages
    const convs = read().filter(c => c.id !== id);
    write(convs);
    const msgs = readMessages().filter(m => m.conversationId !== id);
    writeMessages(msgs);
    return Promise.resolve(true);
  },

  clearUnread(conversationId, viewerRole) {
    const all = read();
    const idx = all.findIndex(c => c.id === conversationId);
    if (idx === -1) return Promise.resolve(null);
    if (viewerRole === 'tutor') all[idx].unreadCountForTutor = 0;
    else all[idx].unreadCountForStudent = 0;
    write(all);
    return Promise.resolve(all[idx]);
  },

  _incrementUnread(conversationId, recipientRole) {
    const all = read();
    const conv = all.find(c => c.id === conversationId);
    if (!conv) return;
    if (recipientRole === 'tutor') conv.unreadCountForTutor = (conv.unreadCountForTutor || 0) + 1;
    else conv.unreadCountForStudent = (conv.unreadCountForStudent || 0) + 1;
    conv.lastMessageAt = new Date().toISOString();
    write(all);
  },

  _touch(conversationId) {
    const all = read();
    const conv = all.find(c => c.id === conversationId);
    if (!conv) return;
    conv.lastMessageAt = new Date().toISOString();
    write(all);
  },

  _read() { return read(); }
};
