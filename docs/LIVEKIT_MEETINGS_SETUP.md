# Connect Group Video Meetings

Connect's `/meetings` page provides a browser-based group video meeting entry point using LiveKit.

## Required server configuration

Create a LiveKit Cloud project (or use a compatible self-hosted LiveKit deployment), then add these server-side environment variables to Netlify:

- `LIVEKIT_URL`: secure WebSocket project URL beginning with `wss://`
- `LIVEKIT_API_KEY`: project API key
- `LIVEKIT_API_SECRET`: matching project secret

Keep the API key and secret server-only. Never add them to `NEXT_PUBLIC_*` variables, client code, or GitHub.

## How it works

- Only signed-in members who pass Connect's server-side verified-adult and active-account checks can request a meeting token.
- Creating a meeting generates an unguessable room name. Share the resulting Connect invitation link only with people you want to invite.
- Each invited member signs in and receives their own short-lived, room-scoped LiveKit token. Tokens expire after two hours.
- The first participant to connect causes LiveKit to create the room; the room closes after the last participant leaves, subject to LiveKit's room lifecycle.
- The browser is redirected to LiveKit Meet's hosted custom-room interface for video, microphone, camera, participant and screen-sharing controls.

## Important limitations and release checks

- LiveKit credentials must be configured before calls can connect. Without them the page returns a clear not-configured response.
- The invitation URL is a bearer invitation: anyone who obtains it and has an eligible Connect account can join. Do not post it publicly.
- Current implementation does not persist meeting schedules, enforce friend-only invitations, add a host waiting room, moderate/remove participants, or provide call recording. Do not promise these controls until they are implemented and tested.
- Meeting UI is hosted by LiveKit Meet; the actual media service and its terms, usage limits, and pricing are governed by the selected LiveKit deployment.
- GitHub Pages publishes only the static preview and cannot run the token API. Use the full Next.js deployment on Netlify for working meetings.
