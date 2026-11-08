# Connect backend setup and release checklist

This checklist consolidates the Appwrite setup for the existing Connect Next.js application. It is a configuration guide, not proof that the production backend is connected.

## Important project boundaries

- Use the existing Connect Appwrite project and database. Do not create another database just to satisfy an optional feature.
- Deploy the Next.js application to Render for server-rendered pages and API routes. GitHub Pages publishes only the static `docs/` preview and cannot run authentication, API routes, or Appwrite server code.
- The static public preview is `https://nasras0837-star.github.io/ConnectTime-/`. The full application is intended for the Render hostname `https://connect-web.onrender.com` once its service is deployed. A configured URL is not evidence that the service is live.
- Keep `APPWRITE_API_KEY` and all provider secrets server-only. Never use a `NEXT_PUBLIC_` prefix for secrets.
- Tables must remain private. The browser must not receive Appwrite server credentials or be granted broad access to member data.

## Step 1 — Configure Appwrite authentication

1. In the existing Appwrite project, add a Web platform for the exact Render production hostname and any staging hostname used for testing.
2. Configure the project endpoint and project ID in Render environment variables:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
3. Verify Appwrite email/password signup, login, logout, session cookie handling, and redirects on the deployed Next.js site.
4. Do not treat the signup 18+ checkbox as age verification.

## Step 2 — Configure server access and adult eligibility

Set:
- `APPWRITE_API_KEY`
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`

Create a private member-access collection as described in `APPWRITE_AUTHORIZATION.md`. Document IDs must equal the Appwrite user ID. Only trusted server-side code and the eventual verified provider webhook may change eligibility or account status. A missing record or unavailable service must deny protected access.

**Important:** Connect uses Veriff. Configure the private verification records table and server-only `VERIFF_BASE_URL`, `VERIFF_API_KEY`, `VERIFF_SHARED_SECRET`, and `VERIFF_CALLBACK_URL` values as documented in `VERIFF-AGE-VERIFICATION-SETUP.md`. Do not manually mark real members verified as a shortcut.

## Step 3 — Create private tables in the existing Appwrite database

Set `APPWRITE_DATABASE_ID` to the existing database. Create only the tables needed for features you intend to test, then set their actual table IDs in Render:

| Table purpose | Environment variable | Setup guide |
|---|---|---|
| Profiles | `APPWRITE_PROFILES_TABLE_ID` | `APPWRITE_PROFILE_TABLE_SETUP.md` |
| Member settings | `APPWRITE_MEMBER_SETTINGS_TABLE_ID` | `APPWRITE_ACCOUNT_SETTINGS_SETUP.md` |
| Friend requests | `APPWRITE_FRIEND_REQUESTS_TABLE_ID` | `APPWRITE_FRIEND_REQUESTS_SETUP.md` |
| Notifications | `APPWRITE_NOTIFICATIONS_TABLE_ID` | `APPWRITE_NOTIFICATIONS_SETUP.md` |
| Private messages | `APPWRITE_MESSAGES_TABLE_ID` | `APPWRITE_MESSAGES_SETUP.md` |
| Community posts/comments/reactions | `APPWRITE_COMMUNITY_POSTS_TABLE_ID`, `APPWRITE_COMMUNITY_COMMENTS_TABLE_ID`, `APPWRITE_COMMUNITY_REACTIONS_TABLE_ID` | `APPWRITE_COMMUNITY_POSTS_SETUP.md` |
| Community blocks/reports/appeals | `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`, `APPWRITE_COMMUNITY_REPORTS_TABLE_ID`, `APPWRITE_COMMUNITY_APPEALS_TABLE_ID` | `community-safety-backend-setup.md` |
| Groups/members/posts | `APPWRITE_COMMUNITY_GROUPS_TABLE_ID`, `APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID`, `APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID` | `APPWRITE_COMMUNITY_GROUPS_SETUP.md` |
| Free TV watchlist | `APPWRITE_FREE_TV_WATCHLIST_TABLE_ID` | `APPWRITE_FREE_TV_WATCHLIST_SETUP.md` |
| Verification records | `APPWRITE_VERIFICATION_RECORDS_TABLE_ID` | `VERIFF-AGE-VERIFICATION-SETUP.md` |

Use the exact column IDs, types, sizes, required flags, and indexes in each guide. Do not guess a schema from the UI. Keep all tables private and access them through server-side APIs.

## Step 4 — Configure hosting

Use the Render Blueprint in the repository root (`render.yaml`):
- Repository: `nasras0837-star/ConnectTime-`
- Branch: `main`
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Node.js: 22
- Health check: `/api/auth/status`

Follow `docs/RENDER_DEPLOYMENT.md` to create the Render web service, add the manual environment values, and allow the exact Render hostname in Appwrite. GitHub Pages remains the static public preview only; it cannot host Next.js authentication or server APIs.

## Step 5 — Verify one feature at a time

Use two separate test accounts and confirm both expected and denied behavior:
- Signup/login/logout and session persistence.
- Profile create/read/update and unique handle collision.
- Friend request send/accept/decline/cancel.
- Notifications private to the recipient.
- Messages only between accepted connections; block in either direction denies sending/reading.
- Community feed, comments, and reactions enforce member eligibility and block rules.
- Group privacy and membership rules.
- Settings and live-feed preference isolation.
- Storage outage, missing table, missing access record, unauthenticated requests, cross-user IDs, and malformed inputs all fail safely.

A passing build or security workflow does not prove that Appwrite tables, secrets, domains, or production data are configured correctly.

## Current known limitations — do not advertise as finished

- Veriff integration code is implemented, but production credentials, Appwrite verification table, webhook registration, and end-to-end test decisions still need configuration and verification.
- Backend environment variables and table IDs have not been confirmed configured in Render.
- Group owner approval, invitations, and group moderation are incomplete.
- Messaging is request/refresh based, not real-time; no attachments or group chats.
- Notifications are in-app only; no email, push, or real-time delivery.
- Photo/video uploads and public publishing remain disabled pending a tested quarantine/moderation pipeline.
- Advertising payment, ad delivery, and verified impression counting are not confirmed operational.
- Event submissions are local previews, not public persistent listings.
- The static GitHub Pages preview cannot exercise any server-side feature.

## Release gate

Do not open public registration for full social access until the age-verification workflow, member-access provisioning, privacy/security review, moderation and incident-response process, backup/retention rules, and end-to-end tests have been completed.
