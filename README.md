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

The Next.js foundation includes the landing page, sample feed, Chat Rooms prototype, News page, ConnectTime Video Tube page, advertising campaign planner, and a floating AI assistant interface. The AI assistant needs a server-side `OPENAI_API_KEY` in Netlify before it can return live AI responses.

The authentication foundation uses Appwrite SSR handlers and a restricted account page. Appwrite project configuration is still required before signup/login can work in deployment. Initial friend-request, notification, private one-to-one messaging, profile editing, and account notification-preference APIs and pages are now in the repository. The account settings page requires the private table described in `docs/APPWRITE_ACCOUNT_SETTINGS_SETUP.md`. They require the corresponding private Appwrite tables and server environment variables described in `docs/APPWRITE_FRIEND_REQUESTS_SETUP.md`, `docs/APPWRITE_NOTIFICATIONS_SETUP.md`, and `docs/APPWRITE_MESSAGES_SETUP.md`. Configure the variables in `.env.example` in Netlify's environment-variable settings; keep server secrets private and never expose them through `NEXT_PUBLIC_*` variables.

## Safety and production readiness

This repository is a staged prototype, not a production-ready social network. Do not enable public social access until:
- Appwrite is configured and authentication/session flows are tested.
- Adult eligibility is independently verified by a trusted age/identity provider; a self-declared birth date or checkbox is not sufficient.
- Server-controlled account activation and permissions are enforced.
- Media uploads, content moderation, abuse reporting, rate limits, privacy controls, and retention policies are implemented and tested.
- Real-time messaging delivery, calls, creator/video publishing, marketplace transactions, advertising delivery/billing, and verified impression analytics have secure backend services. The initial private messaging API is request/refresh based and requires Appwrite setup; it is not real-time.
- Security, integration, accessibility, and deployment tests pass.

## Local development

1. Install Node.js 22.
2. Create a dedicated Appwrite Cloud project and add a Web platform for `localhost`.
3. Configure a least-privilege Appwrite server API key and the environment variables in `.env.example`.
4. Run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.

Never commit real environment secrets.


The homepage live-interest feed now syncs topic preferences to the signed-in, verified adult member's private Appwrite settings row. Configure the optional `live_feed_topics` string column as described in `docs/APPWRITE_ACCOUNT_SETTINGS_SETUP.md`; signed-out visitors retain device-local preferences.


The first persistent community feed is available at `/community` for text-only posts. It requires a private Appwrite `community_posts` table and the server environment variable `APPWRITE_COMMUNITY_POSTS_TABLE_ID`; see `docs/APPWRITE_COMMUNITY_POSTS_SETUP.md`. Posting and viewing are restricted to independently verified, active adult members. Photo/video publishing remains disabled pending a tested moderation pipeline.


Community posts now support text comments and Like reactions through private Appwrite tables. Configure `APPWRITE_COMMUNITY_COMMENTS_TABLE_ID` and `APPWRITE_COMMUNITY_REACTIONS_TABLE_ID` using `docs/APPWRITE_COMMUNITY_POSTS_SETUP.md` before live testing.


## ConnectTime product positioning

**ConnectTime is an all-in-one media and community platform** — bringing social connection, member discovery, community discussions and groups, news, video discovery, official TV destinations, events, and advertising tools into one web experience. Brand promise: **Your people. Your passions. Your ConnectTime.**

The public homepage at `/` introduces this platform vision and directs visitors to the existing product areas. The dedicated official broadcaster directory remains at `/free-tv`. Some areas are prototypes or require Appwrite/Netlify configuration; do not advertise unfinished features as operational or promise universal free access to third-party streams.
