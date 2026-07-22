/**
 * LeftNav — list of conversations, summary strip, delete, unread, offer status
 */
export function createLeftNav({ store, conversationService, profileService, offerService }) {
  let container = null;
  let conversations = [];
  let profilesMap = new Map();
  let offerSummary = { byConversation: {}, counts: { pending:0, accepted:0, rejected:0 } };

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff/60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs/24);
    return `${days}d`;
  }

  async function refresh() {
    const state = store.getState();
    if (!state.currentUserId) return;
    conversations = await conversationService.listConversations(state.currentUserId, state.currentRole);
    // fetch profiles for other side
    const ids = conversations.map(c => state.currentRole === 'tutor' ? c.studentId : c.tutorId);
    const unique = [...new Set(ids)];
    const profs = await Promise.all(unique.map(id => profileService.getProfile(id)));
    profilesMap = new Map(profs.filter(Boolean).map(p => [p.id, p]));

    // fetch offer summary for these conversation ids
    const convIds = conversations.map(c => c.id);
    if (convIds.length) {
      try {
        offerSummary = await offerService.getOfferSummary(convIds);
      } catch (e) {
        console.error(e);
        offerSummary = { byConversation: {}, counts: { pending:0, accepted:0, rejected:0 } };
      }
    } else {
      offerSummary = { byConversation: {}, counts: { pending:0, accepted:0, rejected:0 } };
    }

    render();
  }

  function render() {
    if (!container) return;
    container.innerHTML = '';
    const state = store.getState();
    const isCollapsed = state.leftCollapsed;

    // header
    const header = document.createElement('div');
    header.className = 'left-nav-header';

    const top = document.createElement('div');
    top.className = 'left-nav-top';
    const title = document.createElement('div');
    title.className = 'left-nav-title';
    title.textContent = `Conversations (${conversations.length})`;
    const toggle = document.createElement('button');
    toggle.className = 'collapse-toggle';
    toggle.setAttribute('aria-label', isCollapsed ? 'Expand navigation' : 'Collapse navigation');
    toggle.textContent = isCollapsed ? '›' : '‹';
    toggle.addEventListener('click', () => {
      store.setState({ leftCollapsed: !store.getState().leftCollapsed });
      store.publish('ui:leftCollapse', !isCollapsed);
      // update layout class via main
      render();
      document.dispatchEvent(new CustomEvent('leftCollapseChanged', { detail: !isCollapsed }));
    });
    top.appendChild(title);
    top.appendChild(toggle);
    header.appendChild(top);

    const summary = document.createElement('div');
    summary.className = 'left-nav-summary';
    summary.innerHTML = `
      <span><span class="dot pending"></span>Pending: <strong>${offerSummary.counts.pending||0}</strong></span>
      <span><span class="dot accepted"></span>Accepted: <strong>${offerSummary.counts.accepted||0}</strong></span>
      <span><span class="dot rejected"></span>Rejected: <strong>${offerSummary.counts.rejected||0}</strong></span>
    `;
    header.appendChild(summary);
    container.appendChild(header);

    // list
    const list = document.createElement('div');
    list.className = 'conversation-list';
    list.setAttribute('role','list');

    if (conversations.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-nav';
      empty.textContent = 'No conversations yet.';
      list.appendChild(empty);
    } else {
      for (const conv of conversations) {
        const otherId = state.currentRole === 'tutor' ? conv.studentId : conv.tutorId;
        const profile = profilesMap.get(otherId);
        const isActive = state.activeConversationId === conv.id;
        const unread = state.currentRole === 'tutor' ? conv.unreadCountForTutor : conv.unreadCountForStudent;
        const offerStatus = offerSummary.byConversation[conv.id] || null;

        const item = document.createElement('div');
        item.className = `conv-item ${isActive ? 'active' : ''}`;
        item.setAttribute('role','listitem');
        item.tabIndex = 0;
        item.setAttribute('aria-label', `Open conversation with ${profile?.name || 'Unknown'}`);

        const img = document.createElement('img');
        img.src = profile?.profilePicUrl || 'https://i.pravatar.cc/100?img=1';
        img.alt = profile?.name || 'avatar';

        const meta = document.createElement('div');
        meta.className = 'conv-meta';
        const nameEl = document.createElement('div');
        nameEl.className = 'conv-name';
        nameEl.textContent = profile?.name || otherId;
        const preview = document.createElement('div');
        preview.className = 'conv-preview';
        preview.textContent = profile ? (state.currentRole === 'tutor' ? profile.subject || profile.school || '' : profile.specialty || '') : '';
        meta.appendChild(nameEl);
        meta.appendChild(preview);

        const right = document.createElement('div');
        right.className = 'conv-right';
        const timeEl = document.createElement('div');
        timeEl.className = 'conv-time';
        timeEl.textContent = timeAgo(conv.lastMessageAt);
        right.appendChild(timeEl);

        if (unread > 0) {
          const badge = document.createElement('div');
          badge.className = 'badge';
          badge.textContent = unread > 99 ? '99+' : String(unread);
          right.appendChild(badge);
        }

        if (offerStatus) {
          if (isCollapsed) {
            const dot = document.createElement('span');
            dot.className = `offer-dot ${offerStatus}`;
            dot.title = offerStatus;
            right.appendChild(dot);
          } else {
            const statusEl = document.createElement('div');
            statusEl.className = `offer-status ${offerStatus}`;
            statusEl.textContent = offerStatus;
            right.appendChild(statusEl);
          }
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'conv-delete';
        delBtn.setAttribute('aria-label', `Delete conversation with ${profile?.name || ''}`);
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.querySelector('.inline-confirm')) return;
          const confirmEl = document.createElement('div');
          confirmEl.className = 'inline-confirm';
          confirmEl.innerHTML = `<span>Delete?</span>`;
          const yes = document.createElement('button');
          yes.className = 'btn-small danger';
          yes.textContent = 'Yes';
          const no = document.createElement('button');
          no.className = 'btn-small';
          no.textContent = 'No';
          confirmEl.appendChild(yes);
          confirmEl.appendChild(no);
          item.appendChild(confirmEl);
          yes.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            await conversationService.deleteConversation(conv.id);
            store.publish('conversations:changed', null);
            // if deleted was active, pick next
            if (store.getState().activeConversationId === conv.id) {
              const remaining = conversations.filter(c => c.id !== conv.id);
              if (remaining.length) {
                store.setState({ activeConversationId: remaining[0].id });
                store.publish('activeConversation:changed', remaining[0]);
              } else {
                store.setState({ activeConversationId: null });
                store.publish('activeConversation:changed', null);
              }
            }
          });
          no.addEventListener('click', (ev) => { ev.stopPropagation(); confirmEl.remove(); });
        });

        item.appendChild(img);
        item.appendChild(meta);
        item.appendChild(right);
        item.appendChild(delBtn);

        item.addEventListener('click', async () => {
          store.setState({ activeConversationId: conv.id });
          store.publish('activeConversation:changed', conv);
          await conversationService.clearUnread(conv.id, state.currentRole);
          store.publish('conversations:changed', null);
          // close mobile overlay
          store.publish('ui:closeLeftMobile', true);
        });
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
        });

        list.appendChild(item);
      }
    }

    container.appendChild(list);
  }

  return {
    mount(el) {
      container = el;
      container.className = 'left-nav';
      // collapsed class handling via store
      const applyCollapse = () => {
        if (!container) return;
        const { leftCollapsed } = store.getState();
        container.classList.toggle('collapsed', leftCollapsed);
      };
      store.subscribe('state:changed', applyCollapse);
      store.subscribe('conversations:changed', refresh);
      store.subscribe('conversations:external', refresh);
      store.subscribe('offers:changed', refresh);
      store.subscribe('offers:external', refresh);
      store.subscribe('activeConversation:changed', () => render());
      store.subscribe('messages:changed', refresh);
      store.subscribe('messages:external', refresh);
      refresh();
      applyCollapse();
    },
    refresh
  };
}
