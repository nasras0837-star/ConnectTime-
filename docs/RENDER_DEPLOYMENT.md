# Render deployment for Connect

This repository's full Next.js application is intended to run on Render. GitHub Pages remains the static public preview only; it cannot run Appwrite SSR authentication, API routes, or protected server-side features.

## Deploy the backend

1. Open https://dashboard.render.com/ and choose **New → Blueprint**.
2. Connect GitHub repository `nasras0837-star/ConnectTime-`.
3. Select branch `setup/render-auth-hosting` for this setup preview (after review/merge, change the Blueprint branch to `main`).
4. Render detects the root `render.yaml` and creates the `connect-web` web service.
5. In the service's Environment settings, enter the real values for the variables marked **not synced**:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`: your existing Appwrite Cloud endpoint, including `/v1`.
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: the existing Connect Appwrite project ID.
   - `APPWRITE_API_KEY`: a least-privilege server key; never expose it in browser code.
   - `APPWRITE_ACCESS_DATABASE_ID`: existing private access database ID.
   - `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`: existing private member-access collection ID.
6. Deploy and wait for the health check at `/api/auth/status` to return HTTP 200 with `configured: true`.
7. In Appwrite Console → Auth → Settings / Platforms, add the exact Render hostname (for example, `connect-web.onrender.com`) as a Web platform / allowed origin. Use the actual hostname assigned by Render; do not guess it.
8. Test registration, sign-in, refresh/session persistence, sign-out, and denied access using a test account before inviting members.

## Important

- Render's free web service may spin down after inactivity, so the first request can take longer. It is suitable for staging, not a guaranteed always-on production service.
- Do not place Appwrite API keys or other secrets in GitHub, `NEXT_PUBLIC_*` variables, or the static Pages site.
- The current registration form confirms self-declared 18+ status only. Independent age verification is not yet integrated. Do not enable protected social features until trusted verification, server-side member-access provisioning, and moderation controls are completed.
- GitHub Pages remains at https://nasras0837-star.github.io/ConnectTime-/ and is a static preview. Sign-in and registration must be performed on the Render-hosted Next.js application.
- Render deployment does not automatically migrate or configure Appwrite data. Keep the existing Appwrite project and private tables; use `docs/APPWRITE_GO_LIVE_CHECKLIST.md` for schema and access requirements.
