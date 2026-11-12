# Connect

Connect is an international social and media platform being developed as a Next.js web application.

## Hosting layout

- **Static public preview:** GitHub Pages — https://nasras0837-star.github.io/ConnectTime-/
- **Full application and authentication:** Render web service, configured by `render.yaml`.
- **Authentication and database:** the existing Appwrite project.
- **Repository:** https://github.com/nasras0837-star/ConnectTime-

GitHub Pages publishes only `docs/`; it cannot run Next.js server rendering, Appwrite SSR sessions, API routes, or protected member actions. Render hosts the full Next.js app. Do not use the static preview URL for account registration or login.

## Deploy the full application

1. In Render, choose **New → Blueprint**.
2. Connect `nasras0837-star/ConnectTime-` and select the `main` branch.
3. Render reads `render.yaml` and creates the `connect-web` service.
4. Add the real Appwrite environment values listed in [the Render deployment guide](docs/RENDER_DEPLOYMENT.md).
5. Add the assigned Render hostname as a Web platform / allowed origin in Appwrite.
6. Test registration, sign-in, session persistence, and sign-out before inviting members.

Detailed steps: [Render deployment guide](docs/RENDER_DEPLOYMENT.md).

## GitHub Pages preview

The Pages workflow publishes `docs/` only. Expected URL: https://nasras0837-star.github.io/ConnectTime-/

## Authentication and safety

The app includes Appwrite email/password registration, sign-in, account pages, and server-side member-access checks. The signup 18+ checkbox is not independent age verification. Protected social features must remain unavailable until a trusted age/identity provider, signed verification webhook, server-controlled member-access records, moderation, and end-to-end authorization tests are implemented.

Keep `APPWRITE_API_KEY` and all provider credentials server-only. Never commit real secrets or place them in `NEXT_PUBLIC_*` variables. The Render Blueprint intentionally marks configuration values as manual inputs.

## Staged feature scope

The Next.js foundation includes member profiles, discovery, friend requests, private messaging, notifications, community feed, groups, news, video discovery, official broadcaster directory, events interface, group video meeting entry point, and a floating AI assistant. Many features depend on private Appwrite tables and server environment variables; deploying the web service does not automatically activate them.

Important limitations:
- Independent age verification and provider webhooks are not yet implemented.
- Photo/video uploads and public publishing remain disabled pending a tested quarantine/moderation pipeline.
- Messaging, events, group moderation, creator publishing, marketplace transactions, ad delivery/billing, and some integrations remain staged or incomplete.
- A successful build or healthy Render service does not prove every feature is production-ready.

See [Appwrite go-live checklist](docs/APPWRITE_GO_LIVE_CHECKLIST.md) and the setup guides in `docs/`.

## Local development

1. Install Node.js 24 (matching the Render Blueprint).
2. Configure an Appwrite Web platform for `localhost`.
3. Copy `.env.example` to `.env.local` and enter test values.
4. Run `npm install`, then `npm run dev` (this repository does not commit a package lockfile).
5. Open `http://localhost:3000`.

Never commit real environment secrets.
