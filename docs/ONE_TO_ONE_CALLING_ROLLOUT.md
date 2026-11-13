# ConnectTime one-to-one voice and video calling

This document tracks the implementation contract for issue #144. The existing `/meetings` flow is group/invitation based; it is not a substitute for private member-to-member calling.

## Architecture

- **Media:** LiveKit Cloud (WebRTC SFU); browser clients connect directly to LiveKit.
- **Application/API:** Next.js deployed on the server-capable host (Netlify today; Render is an alternative). The static GitHub Pages preview cannot issue tokens or host authenticated calls.
- **Identity and authorization:** ConnectTime's Appwrite-backed member session and existing friend/message/block checks.
- **Secrets:** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are server-only environment variables. Never use `NEXT_PUBLIC_*`, commit secrets, or expose the API secret to the browser.

## Phase 1 — private 1:1 calls

1. Add a server endpoint to create a call invitation with a cryptographically random call ID and short expiry.
2. Verify caller session, active/verified-adult member status, recipient existence, and allowed relationship (friend or an eligible existing conversation); reject blocked relationships in either direction.
3. Persist call lifecycle state (ringing, accepted, declined, ended, expired) using an Appwrite-backed record and authorize only the two participant IDs.
4. Issue a short-lived, room-scoped LiveKit token to each participant only after authorization. Use unique LiveKit identities per call; never trust participant IDs supplied by the browser.
5. Add Messages/Friends call actions and an incoming-call notification UI. Accept/decline must update server state and notify the caller; use Appwrite Realtime if configured, otherwise a bounded polling fallback.
6. In-call UI: microphone mute, camera toggle, leave/end call, permission/error/reconnect states. Audio-only mode must request no camera permission.
7. Ensure call end/decline/expiry cleans up app state and disconnects media. Do not record calls by default.

## Security and release gates

- Same-origin/CSRF checks on state-changing endpoints; rate-limit call initiation and prevent repeated ringing.
- Enforce authorization server-side for every call action and token request; room names are not authorization.
- Block/report controls remain available; blocked users cannot call or join each other's rooms.
- Tokens are short-lived and no-store; secrets remain server-side.
- Validate camera/microphone permissions, two-browser acceptance/decline, expired token, blocked user, unauthorized participant, network failure, and mobile responsive behavior in staging.
- Keep the feature behind a rollout flag until LiveKit credentials and tests are verified.

## Phase 2 (later)

Group calls, screen sharing, host moderation/waiting rooms, and call scheduling are separate scope. Existing `/meetings` is group-meeting functionality and should remain distinct.
