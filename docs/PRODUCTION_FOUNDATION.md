# ConnectTime production foundation

## Backend decision
ConnectTime is migrating to Appwrite Cloud. Supabase is no longer the planned backend for this project. Do not apply the legacy Supabase SQL reference or configure Flirt/Pleasure projects for ConnectTime.

## Current milestone
The repository contains a Next.js App Router foundation, Appwrite SSR authentication handlers, Appwrite React provider, email/password signup and login, and a restricted account page. This is an integration scaffold, not a production-ready social network.

## Appwrite project setup
1. Create a dedicated Appwrite Cloud project named ConnectTime in the Appwrite Console.
2. Add a Web platform with hostname `localhost`; add the production domain only after it is selected.
3. Create a server API key with scopes `users.read`, `users.write`, and `sessions.write`. Keep it server-side.
4. Copy `.env.example` to `.env.local` and set the endpoint, project ID, and API key.
5. Run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build`.

## Security and age gating
- A self-declared age, date of birth, or checkbox is not age verification.
- New accounts must remain pending and must not access discovery, messaging, uploads, Match Maker, marketplace, video, or live features until an approved provider independently verifies adult eligibility.
- Verification and account activation must be stored in server-controlled records. Never trust client-writable preferences or profile fields.
- Never expose an Appwrite API key in browser code. Use user-session scoped access for normal requests.
- Configure table, row, bucket, and file permissions explicitly; default-deny sensitive resources.
- Add rate limiting, abuse detection, audit events, account recovery, and privacy/data-retention policies before production.

## Next milestones
1. Complete Appwrite project setup and verify SSR auth locally.
2. Design TablesDB tables and permissions for server-controlled profiles, friend graph, posts, comments, reactions, and messaging.
3. Integrate a trusted age/identity provider with server-only status updates.
4. Add private media buckets, upload validation, moderation, and retention controls.
5. Build marketplace, Match Maker, news, video/live, and monetization after compliance and safety controls are designed.
6. Add integration tests, dependency auditing, deployment configuration, backups, and incident response.
