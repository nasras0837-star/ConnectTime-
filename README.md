# ConnectTime

ConnectTime is an international social platform being built as a web application.

## Website deployment

The primary preview host is **Netlify**. The current application is a Next.js 16 App Router project in the repository root.

- Netlify site: https://connecttime-sm.netlify.app
- Netlify deploy dashboard: https://app.netlify.com/projects/connecttime-sm/deploys
- Repository: https://github.com/nasras0837-star/ConnectTime-

Connect the Netlify site to this repository with:
- **Production branch:** `main`
- **Base directory:** leave blank (repository root)
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** `22` (also set by `netlify.toml`)

Netlify's current Next.js runtime detects Next.js automatically and provisions the server functions needed for App Router pages and route handlers. Do not add a static SPA fallback such as `/* /index.html 200`; it can break Next.js server routes.

After connecting the repository, trigger the first production deploy from Netlify. Later pushes to `main` should deploy automatically when continuous deployment is enabled.

## GitHub Pages preview

The GitHub Pages workflow publishes only `docs/`, which is a separate static design preview. It is not the full Next.js application and does not provide live authentication, API routes, or backend functionality.

Expected static preview URL: https://nasras0837-star.github.io/ConnectTime-/

## Current implementation status

The Next.js foundation includes the landing page, member discovery and profiles, friend requests, private messaging, notifications, community feed, groups, News, ConnectTime Video Tube, official broadcaster directory, advertising campaign planner, events interface, group video meeting entry point, and floating AI assistant. These features depend on Appwrite tables and server environment configuration described in `.env.example` and `docs/`. The AI assistant needs a server-side `OPENAI_API_KEY` in Netlify before it can return live AI responses.

Authentication uses Appwrite SSR handlers. Member-facing social functions require independently verified adult eligibility and an active server-side account. Do not treat self-declared age or a checkbox as verification.

### Group video meetings

The `/meetings` page creates private, unguessable LiveKit room invitations and issues short-lived room-scoped tokens only to signed-in, independently verified adult members with active accounts. The browser joins through LiveKit Meet. Configure `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` using [`docs/LIVEKIT_MEETINGS_SETUP.md`](docs/LIVEKIT_MEETINGS_SETUP.md). This requires the full Next.js deployment; GitHub Pages cannot run the token API. Friend-only invite enforcement, persistent scheduling, waiting rooms, host moderation, and recording are not implemented.

### Events

The Events page now calls `/api/events` rather than showing invented sample listings. The API supports:
- verified adult member event submission with server-side validation and a per-member rate limit;
- moderator-review status for new submissions (not public by default);
- approved upcoming event discovery and category filtering for eligible members.

Configure a private Appwrite events table and `APPWRITE_EVENTS_TABLE_ID` using [the events setup guide](docs/APPWRITE_EVENTS_SETUP.md). A moderator approval queue, attendee RSVP/management, event editing/cancellation, ticket payments, calendar integration, and event notifications are not yet implemented. The Events UI is not a finished event marketplace.

## Safety and production readiness

This repository is a staged prototype, not a production-ready social network. Do not enable public social access until:
- Appwrite is configured and authentication/session flows are tested.
- Adult eligibility is independently verified by a trusted age/identity provider; a self-declared birth date or checkbox is not sufficient.
- Server-controlled account activation and permissions are enforced.
- Media uploads, content moderation, abuse reporting, rate limits, privacy controls, and retention policies are implemented and tested.
- Real-time messaging delivery, calls, creator/video publishing, marketplace transactions, advertising delivery/billing, and verified impression analytics have secure backend services.
- Security, integration, accessibility, and deployment tests pass.

## Backend configuration checklist

Use [`docs/APPWRITE_GO_LIVE_CHECKLIST.md`](docs/APPWRITE_GO_LIVE_CHECKLIST.md) for the ordered Appwrite, Netlify environment, private-table, and release-readiness steps. The complete variable-name template is in [`.env.example`](.env.example). These files contain placeholders only; they do not configure hosted services.

## Local development

1. Install Node.js 22.
2. Create a dedicated Appwrite Cloud project and add a Web platform for `localhost`.
3. Configure a least-privilege Appwrite server API key and the environment variables in `.env.example`.
4. Run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.

Never commit real environment secrets.

## Product positioning

**ConnectTime is an all-in-one media and community platform** — bringing social connection, member discovery, community discussions and groups, news, video discovery, official TV destinations, events, and advertising tools into one web experience.

Brand promise: **Your people. Your passions. Your ConnectTime.**

Some areas remain prototypes or require Appwrite/Netlify configuration. Do not advertise unfinished features as operational or promise universal free access to third-party streams.

## Member feedback survey

The private member feedback survey is available at `/feedback`. Signed-in users can submit a 1–5 rating, describe their experience, and suggest new features or improvements. Configure the private Appwrite table using [`docs/APPWRITE_USER_FEEDBACK_SETUP.md`](docs/APPWRITE_USER_FEEDBACK_SETUP.md) and set `APPWRITE_USER_FEEDBACK_TABLE_ID` in the server environment. Submissions are not public; a role-protected review dashboard is not yet implemented.
