/**
 * OfferCard — renders offer inline
 */
export function createOfferCard({ store, offerService, profileService }) {
  return async function renderOfferCard(message, { mine, avatarUrl, currentRole, onUpdate }) {
    const row = document.createElement('div');
    row.className = `message-row ${mine ? 'mine' : 'theirs'}`;

    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = avatarUrl || 'https://i.pravatar.cc/100';
    avatar.alt = 'avatar';

    const wrap = document.createElement('div');
    wrap.className = 'message-bubble-wrap';

    // fetch offer
    let offer = null;
    try { offer = await offerService.getOffer(message.content); } catch {}

    const card = document.createElement('div');
    card.className = 'offer-card';

    if (!offer) {
      card.textContent = 'Offer not found (data may have been cleared)';
      wrap.appendChild(card);
      row.appendChild(avatar);
      row.appendChild(wrap);
      return row;
    }

    const header = document.createElement('div');
    header.className = 'offer-card-header';
    const title = document.createElement('div');
    title.className = 'offer-card-title';
    title.textContent = offer.courseTitle;
    const badge = document.createElement('span');
    badge.className = `offer-badge ${offer.status}`;
    badge.textContent = offer.status;
    header.appendChild(title);
    header.appendChild(badge);
    card.appendChild(header);

    if (offer.summary) {
      const sum = document.createElement('div');
      sum.className = 'offer-summary';
      sum.textContent = offer.summary;
      card.appendChild(sum);
    }

    const body = document.createElement('div');
    body.className = 'offer-card-body';
    const addRow = (label, value) => {
      const r = document.createElement('div');
      r.className = 'offer-row';
      const l = document.createElement('span');
      l.className = 'label';
      l.textContent = label;
      const v = document.createElement('span');
      v.className = 'value';
      v.textContent = value;
      r.appendChild(l); r.appendChild(v);
      body.appendChild(r);
    };
    addRow('Dates', `${offer.startDate} → ${offer.endDate}`);
    addRow('Time', offer.time);
    addRow('Amount', `$${offer.amount}`);

    card.appendChild(body);

    const meta = document.createElement('div');
    meta.className = 'offer-meta';
    const time = document.createElement('span');
    time.textContent = new Date(offer.createdAt).toLocaleString();
    meta.appendChild(time);
    if (offer.editedAt) {
      const edited = document.createElement('span');
      edited.className = 'edited-tag';
      edited.textContent = 'Edited';
      edited.title = `Edited at ${new Date(offer.editedAt).toLocaleString()}`;
      meta.appendChild(edited);
    }
    card.appendChild(meta);

    // actions
    if (offer.status === 'pending') {
      if (currentRole === 'student') {
        const actions = document.createElement('div');
        actions.className = 'offer-card-actions';
        const accept = document.createElement('button');
        accept.className = 'btn-accept';
        accept.textContent = 'Accept';
        const reject = document.createElement('button');
        reject.className = 'btn-reject';
        reject.textContent = 'Reject';
        accept.addEventListener('click', async () => {
          await offerService.acceptOffer(offer.id);
          store.publish('offers:changed', { conversationId: offer.conversationId });
          if (onUpdate) onUpdate();
        });
        reject.addEventListener('click', async () => {
          await offerService.rejectOffer(offer.id);
          store.publish('offers:changed', { conversationId: offer.conversationId });
          if (onUpdate) onUpdate();
        });
        actions.appendChild(accept);
        actions.appendChild(reject);
        card.appendChild(actions);
      } else if (currentRole === 'tutor' && mine) {
        // tutor can edit pending offer they created
        const actions = document.createElement('div');
        actions.className = 'offer-card-actions';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit-offer';
        editBtn.textContent = 'Edit offer';
        editBtn.addEventListener('click', () => {
          store.publish('ui:editOffer', offer);
        });
        actions.appendChild(editBtn);
        card.appendChild(actions);
      }
    }

    wrap.appendChild(card);

    // message meta (time of message)
    const msgMeta = document.createElement('div');
    msgMeta.className = 'message-meta';
    msgMeta.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    wrap.appendChild(msgMeta);

    if (!mine) row.appendChild(avatar);
    row.appendChild(wrap);
    if (mine) row.appendChild(avatar);

    return row;
  };
}
