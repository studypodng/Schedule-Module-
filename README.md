# estudy — Tutor / Student Chat Dashboard

A production-quality vanilla JS chat module with custom offers, built for a live ed-tech platform. No frameworks, no build step.

## How to run

You **must** serve via a local static server — ES modules are blocked under `file://`.

```bash
# Option 1: Node
npx serve tutor-student-chat
# then open http://localhost:3000/tutor.html and http://localhost:3000/student.html

# Option 2: Python
cd tutor-student-chat
python3 -m http.server 8000
# open http://localhost:8000/tutor.html and /student.html in two tabs

# Option 3: VS Code Live Server extension
# Right-click tutor.html → Open with Live Server
```

Open **tutor.html in one tab** and **student.html in another** of the same browser to test cross-tab sync (localStorage + `storage` event).

## Demo accounts

- **Tutor**: `tutor-1` — Dr. Sarah Chen (online)
- **Student**: `student-1` — Alex Morgan

Other mock users exist to populate the left navigation.

## File structure

```
/tutor-student-chat
  /components
    Header.js        — other party avatar, name, online/offline dot
    LeftNav.js       — conversation list, unread badge, offer status dot/label, summary strip, delete
    RightPanel.js    — profile + details + stats of the other party
    ChatWindow.js    — message list (aria-live polite), input, offer action bar
    MessageBubble.js — text message with soft-delete + inline confirm
    OfferCard.js     — offer inline card with Accept/Reject (student) / Edit (tutor)
    OfferForm.js     — modal form for create / edit offer, validation
  /services
    ChatService.js         — send/read/soft-delete messages, bumps unread + lastMessageAt
    OfferService.js        — create/read/update/accept/reject, getOfferSummary, NO delete
    ConversationService.js — list/delete/clearUnread
    ProfileService.js      — read-only profiles + stats
  /state
    store.js         — pub/sub event bus + storage-event re-publish for cross-tab sync
  /styles
    variables.css, layout.css, nav.css, chat.css, offer.css
  tutor.html / student.html — thin shells importing initApp()
  main.js — DEMO_TUTOR_ID/DEMO_STUDENT_ID, seeding, layout shell, component wiring
```

## Architecture (5 layers)

1. **Components** — render only, read from store, emit events, never touch localStorage directly.
2. **State store** — `subscribe`, `publish`, in-memory state (`activeConversationId`, collapsed flags, etc.).
3. **Services** — adapter layer over localStorage with Promise-returning API shape (easy backend swap).
4. **Data source** — `localStorage` keys: `estudy_profiles`, `estudy_stats`, `estudy_conversations`, `estudy_messages`, `estudy_offers`.
5. **Cross-tab sync** — `window.addEventListener('storage')` in store.js re-publishes `conversations:changed`, `messages:changed`, `offers:changed` so the other tab re-renders without manual refresh.

### Backend-swap seam

- Components import only from `services/` and `state/store.js`.
- Services expose Promise APIs identical to a REST API would: `listConversations()`, `sendMessage()`, `createOffer()`, etc.
- To swap to a real backend, replace the internals of each service file to `fetch()` your API and keep method signatures. No component changes required.
- `OfferService` intentionally has **no delete method** — this contract must be preserved in the backend as well.

## Data schema

See main task description — `Profile`, `Stats`, `Conversation`, `Offer` (with `editedAt`), `Message` (with `deleted` soft flag). IDs via `crypto.randomUUID()`, timestamps via `new Date().toISOString()`.

### Key invariants enforced

- **Offer/message pairing**: `OfferService.createOffer` atomically creates both the `Offer` and its paired `Message { type:'offer', content: offer.id }`. `updateOffer` does NOT create a new message; the card re-renders live via `OfferService.getOffer`.
- **Resolving offer messages**: `ChatWindow`/`MessageBubble` fetches full `Offer` via `OfferService` before rendering `OfferCard`; message never duplicates offer details.
- **Unread**: `ChatService.sendMessage` increments `unreadCountFor<RecipientRole>`; selecting a conversation calls `ConversationService.clearUnread` for viewer.
- **One pending per conversation**: UI gates creation — tutor sees "Edit pending offer" if one exists; service also rejects second pending.
- **Delete vs edit**: Delete button only appears on `type:'text'` messages; offer cards never show delete. Offer edit only while `status === 'pending'`, stamps `editedAt`, shows "Edited" label.
- **Conversation delete**: removes conversation + its messages, **never cascades to offers** — accepted offers are permanent sales records. Once parent conv is deleted, offers remain in storage but disappear from UI summaries (no conv to attach to).

## UX

- Header: other party avatar/name + online dot or "Offline · 2h ago".
- Left nav: avatar, name, notification badge, offer status indicator (text when expanded, colored dot when collapsed), summary strip `Pending: X · Accepted: Y · Rejected: Z` live-synced via `getOfferSummary`.
- Right panel: Profile (pic/name/subject), Details (username/school/subject/timezone vs specialty/experience/timezone), Stats (sessions done vs taught+completion).
- Chat: inline offer cards with distinct styling + status badge, soft-deleted placeholder, mobile-first down to 360px, keyboard accessible, visible focus states, inline delete confirmation (no native confirm).
- Offer form: required fields, end >= start, positive amount, inline errors.
- Collapsible panels (desktop/tablet only): chevron toggle per panel, icon-only when collapsed.
- Mobile (<768px): hamburger opens left nav overlay, chat full screen, right panel hidden. Breakpoints: 768, 1024.

## Known limitations (intentional)

- No auth — hardcoded demo tutor/student.
- Left nav seeded with extra mock conversations for list CRUD testing; only `DEMO_TUTOR_ID`/`DEMO_STUDENT_ID` conversation is live two-way across tabs.
- Sync only across tabs of same browser (localStorage + storage event), not across browsers/devices.
- Deleting a conversation removes it (and messages) from the shared local dataset for both sides — in real system would be per-user archive. Never cascades to Offers, which persist.
- One pending offer per conversation at a time.

## Reset demo data

- Button "Reset demo data" in header (also `window.estudyReset()` in console) clears and re-seeds localStorage.
