# ConnectTime

ConnectTime is an international, adults-only social platform being built as a web application.

## Repository contents
- `app/`: Next.js App Router application with Appwrite SSR authentication.
- `app/api/appwrite/`: Appwrite's server-side authentication handlers.
- `app/providers.tsx`: Appwrite React provider and session hydration.
- `index.html`, `styles.css`, `app.js`: original standalone visual prototype.

## Current status
The Next.js foundation is being migrated to Appwrite Cloud. It includes a landing page, email/password signup and login, SSR session handling, and a restricted account status page. The Appwrite project and credentials still need to be configured. No database, media storage, social graph, or production age-verification provider has been deployed.

New accounts remain pending. A self-declared birth date or checkbox is not verification and does not grant access to social features. Only a trusted server-side verification process may activate adult eligibility.

## Run locally
1. Install Node.js LTS.
2. Create a dedicated Appwrite Cloud project and add a Web platform for `localhost`.
3. Create a server API key with `users.read`, `users.write`, and `sessions.write` scopes. Keep it secret.
4. Run `npm install`.
5. Copy `.env.example` to `.env.local` and enter the Appwrite endpoint, project ID, and server API key.
6. Run `npm run dev` and open `http://localhost:3000`.

## Security notes
- Never commit real environment secrets.
- Never expose `APPWRITE_API_KEY` in browser code or a `NEXT_PUBLIC_*` variable.
- Configure Appwrite resource permissions with least privilege.
- Keep accounts pending until independent adult verification and server-side review.
- Production access stays disabled until age verification, moderation, abuse controls, privacy/legal review, and security testing are complete.

See [docs/PRODUCTION_FOUNDATION.md](docs/PRODUCTION_FOUNDATION.md) for the roadmap.
