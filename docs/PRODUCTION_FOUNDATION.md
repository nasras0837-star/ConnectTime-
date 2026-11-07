# ConnectTime production foundation

## Current milestone
The repository now includes a Next.js App Router foundation, Supabase SSR client utilities, email/password signup and login pages, a restricted account status page, a server-side sign-out route, a database schema reference, and baseline response security headers.

## Environment
Copy `.env.example` to `.env.local` and fill in the URL and publishable key from the dedicated ConnectTime Supabase project. Never commit real credentials. Never expose a Supabase secret/service-role key in browser code or a `NEXT_PUBLIC_*` variable.

## Database
`supabase/schema.sql` is a reviewed starting schema. Apply it only to a new, dedicated ConnectTime Supabase project after review. It must not be applied to Flirt or Pleasure. The schema deliberately leaves new accounts pending. Clients cannot write adult verification or account status fields. A trusted server-side identity/age verification integration must update those fields after provider verification.

## Important access rule
An email address, self-declared date of birth, checkbox, or client-side value is not proof of age. The account remains restricted until an approved provider verifies that the user is an adult. The current scaffold does not yet integrate a verification vendor and must not be represented as production age verification.

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the dedicated Supabase URL and publishable key.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## Next engineering milestones
1. Create a dedicated Supabase project and apply the schema through a migration.
2. Implement provider-backed adult eligibility verification and server-only status updates.
3. Add account recovery, email verification UX, rate limiting, abuse prevention and audit events.
4. Build the social graph, posts, comments, reactions and messaging.
5. Add marketplace, Match Maker, news licensing, video/live infrastructure and monetization only after their compliance and safety controls are designed.
6. Add CI, tests, dependency auditing, CSP and deployment configuration before production.
