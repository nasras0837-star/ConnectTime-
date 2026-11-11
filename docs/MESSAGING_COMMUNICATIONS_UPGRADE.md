# ConnectTime Messaging & Communications Upgrade

Branch: `feature/messaging-communications-upgrade`

## Goals
- Make Messages a simple, responsive hub for conversations, people search, friend requests, and calls.
- Permit direct messaging only after a friend request is accepted (or for an existing accepted connection).
- Provide reliable one-to-one voice/video calling and public/private group conversations.
- Preserve server-side eligibility, visibility, block, and reporting checks.

## Existing implementation (baseline audit)
- `app/messages/page.tsx`: inbox, handle-based conversation opening, message send, periodic refresh, read marking, and message reporting.
- `app/api/messages/route.ts`: authenticated/eligible-member gates; profile visibility checks; mutual block checks; accepted-friendship requirement for GET/POST; inbox aggregation.
- `app/friends/page.tsx` and `app/api/friends/requests/route.ts`: friend workflow exists and should be linked directly from messaging/search.
- `app/chat-rooms/page.tsx` and `app/api/community/groups/[groupId]/messages/route.ts`: group/chat-room foundations exist; validate public discovery, private invitation enforcement, and membership on every operation.
- Existing messages use polling (8 seconds), not a realtime subscription. Do not describe polling as realtime.
- Voice/video calling must be verified against actual signaling/media implementation; UI controls alone are not functional calls.

## Implementation plan
1. **Messaging UX:** split-pane inbox/thread on desktop; conversation-first full-screen layout on mobile; search conversations; clear empty/loading/error states; profile links and friend/request actions; accessible keyboard navigation and composer.
2. **Friend lifecycle:** connect search results to send/cancel/accept/reject requests; after acceptance refresh permissions and make the Message action available; pending/rejected requests must not expose message history or send endpoints.
3. **Conversation reliability:** replace polling with Appwrite Realtime where supported/configured; retain safe fallback refresh; deduplicate messages; preserve ordering; mark read only after the active thread is visible; pagination for history.
4. **Calls:** establish authenticated call signaling, incoming/outgoing call states, accept/decline, microphone/camera permissions, mute/camera toggles, hangup, reconnect and missed-call handling. WebRTC media requires HTTPS and TURN/STUN configuration for reliable NAT traversal.
5. **Groups:** create public discoverable rooms and private invite-only groups; roles/moderation; membership checks on read/send; join/leave/invite flows; unread indicators; group calls only after individual call infrastructure is stable.
6. **Safety:** block/report controls; rate limits; prevent self-messaging; verify membership/visibility on every server endpoint; no private-group data leakage; sanitize/render message content safely.
7. **Tests:** unit/API authorization tests, UI interaction tests, accessibility/mobile checks, and end-to-end staging tests with two test accounts.

## Implementation progress (2026-11-11)
- [x] Messages page now links directly to Friends, Friend Requests, Discover, and Groups.
- [x] Inbox conversation search filters by display name, handle, and latest-message preview.
- [x] Mobile messaging switches between inbox and active thread, with a back-to-inbox control.
- [x] Discover results reflect accepted connections (Message action), outgoing pending requests (Request sent), and incoming requests (Respond to request); otherwise users can send a friend request.
- [x] Existing server-side DM authorization remains authoritative: authenticated verified-adult membership, visible profile, accepted friendship, and mutual block checks.
- [ ] True realtime subscriptions, message history pagination, and robust multi-client delivery.
- [ ] Authenticated WebRTC voice/video signaling and media lifecycle; no claim of working calls until two-client tests pass.
- [ ] Full public/private group membership, invitations, moderation, and two-account authorization validation.
- [ ] Automated tests and live staging verification for the changed flows.

## Acceptance checklist
- [ ] Friend request accepted -> Message action enabled without manual refresh.
- [ ] Stranger/pending/rejected/blocked user cannot read or send DMs.
- [ ] Inbox search and conversation selection work on mobile and desktop.
- [ ] Messages send once, appear in order, and update unread/read status.
- [ ] Incoming/outgoing voice calls work across two clients; mute and hangup work.
- [ ] Video calls work across two clients; camera toggling and permissions work.
- [ ] Public group can be discovered/joined; private group requires invitation.
- [ ] Nonmembers cannot fetch private group messages or post.
- [ ] Group create/invite/leave/moderation paths work.
- [ ] CI, typecheck, lint, and relevant E2E tests pass.

## Configuration / rollout
- Confirm Appwrite Realtime availability and permissions.
- Configure WebRTC signaling and TURN credentials as server secrets; never expose TURN secret keys to clients.
- Keep calls/groups behind feature flags until staging tests pass.
- Use synthetic test accounts only; do not test with real private user conversations.
