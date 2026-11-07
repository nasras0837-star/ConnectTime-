# ConnectTime

ConnectTime is an international, adults-only social platform being built as a web application.

## Repository contents
- `app/`, `lib/`, `proxy.ts`: Next.js App Router application foundation with Supabase SSR authentication.
- `supabase/schema.sql`: initial database schema reference with row-level security and restricted adult eligibility fields.
- `index.html`, `styles.css`, `app.js`: original standalone visual prototype.

## Current status
The Next.js foundation includes a landing page, email/password signup and login, a restricted account status page, Supabase browser/server clients, and a session-refresh proxy. Accounts remain pending until a trusted age-verification provider confirms adult eligibility. A self-declared birth date or checkbox is not sufficient verification.

The database schema is a reference only; it has not been applied to a ConnectTime Supabase project. Do not apply it to Flirt or Pleasure.

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the dedicated ConnectTime Supabase project URL and publishable key.
5. Run `npm run dev` and open `http://localhost:3000`.

## Security notes
- Never commit real environment secrets.
- Never expose a Supabase secret/service-role key in browser code or `NEXT_PUBLIC_*` variables.
- Only trusted server-side verification can change adult/account eligibility.
- Production access stays disabled until age verification, abuse controls, privacy/legal review, and security testing are complete.

See [docs/PRODUCTION_FOUNDATION.md](docs/PRODUCTION_FOUNDATION.md) for the roadmap.
