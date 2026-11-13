# ConnectTime one-to-one calling — implementation and staging setup

This feature is a separate private 1:1 voice/video call flow. It does not replace the invitation-based group meetings feature.

## Included in this implementation

- Appwrite-backed ringing, accepted, declined, and ended call lifecycle.
- Caller and recipient must be eligible adult members, have an accepted friend connection, and not be blocked in either direction.
- 45-second incoming-call ring window and server-side rate limiting.
- Incoming-call notifications (when the existing notifications table is configured) plus in-app polling while the Calls page is open.
- Short-lived LiveKit room tokens issued only to the two authenticated participants after the call is accepted.
- Voice mode requests microphone only. Video mode additionally requests camera.
- Calls are not recorded by ConnectTime.

## Required environment variables

Configure only in the server environment (Netlify/Render); never use NEXT_PUBLIC_ prefixes for LiveKit secrets:

- `ONE_TO_ONE_CALLS_ENABLED=false` until staging checks pass.
- `NEXT_PUBLIC_ONE_TO_ONE_CALLS_ENABLED=false` (set to `true` only alongside the server flag in staging to show the global in-app call banner).
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `APPWRITE_CALLS_TABLE_ID`

Existing Appwrite variables are also required: project endpoint/ID, server API key, database ID, profiles table, friend requests table, community blocks table, access database ID, and member access collection ID.

## Appwrite table

Create a private table and set `APPWRITE_CALLS_TABLE_ID`. Required columns:

| Column | Type | Notes |
| --- | --- | --- |
| caller_user_id | string | Appwrite member ID |
| recipient_user_id | string | Appwrite member ID |
| caller_handle | string | Snapshot for UI |
| caller_name | string | Snapshot for UI |
| recipient_handle | string | Snapshot for UI |
| recipient_name | string | Snapshot for UI |
| call_type | string | `voice` or `video` |
| room_name | string | Random server-generated room name |
| status | string | `ringing`, `accepted`, `declined`, `ended` |
| expires_at | datetime/string | Ring deadline |
| accepted_at | datetime/string | Optional |
| ended_at | datetime/string | Optional |
| created_at | datetime/string | Creation time |
| updated_at | datetime/string | Last update |

Keep the table private; browser clients must never access it directly. The server uses the Appwrite API key. Create indexes for the query patterns used by the API: `(caller_user_id, status, created_at)`, `(recipient_user_id, status, created_at)`, and `(caller_user_id, created_at)`. The existing profile, friend-request, and block tables must also have indexes on the queried user IDs, handles, and status columns.

## Rollout gates

1. Configure the Appwrite table and LiveKit staging credentials.
2. Keep `ONE_TO_ONE_CALLS_ENABLED=false` until schema and credentials are verified.
3. In staging, test two separate eligible accounts: incoming call, accept, decline, voice-only permissions, video permissions, mute, camera toggle, end call, expiry, blocked relationship, unconnected member, unauthorized call ID, and mobile layout.
4. Confirm the LiveKit API secret is absent from client bundles and browser network responses.
5. Enable the feature only in staging for acceptance testing. Production enablement requires a separate approval after all tests pass.

## Known rollout notes

- A global in-app banner polls while ConnectTime is open in a visible browser tab; the recipient does not need to remain on the Calls page.
- This phase does not include OS-level push notifications when the browser is closed or the site is not open.
- LiveKit Cloud credentials and the Appwrite table are external setup requirements; this PR does not create cloud resources or turn on production calling.
