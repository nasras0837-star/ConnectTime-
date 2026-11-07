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

The authentication foundation uses Appwrite SSR handlers and a restricted account page. Appwrite project configuration is still required before signup/login can work in deployment. Configure the variables in `.env.example` in Netlify's environment-variable settings; keep server secrets private and never expose them through `NEXT_PUBLIC_*` variables.

## Safety and production readiness

This repository is a staged prototype, not a production-ready social network. Do not enable public social access until:
- Appwrite is configured and authentication/session flows are tested.
- Adult eligibility is independently verified by a trusted age/identity provider; a self-declared birth date or checkbox is not sufficient.
- Server-controlled account activation and permissions are enforced.
- Media uploads, content moderation, abuse reporting, rate limits, privacy controls, and retention policies are implemented and tested.
- Messaging, calls, creator/video publishing, marketplace transactions, advertising billing, and analytics have secure backend services.
- Security, integration, accessibility, and deployment tests pass.

## Local development

1. Install Node.js 22.
2. Create a dedicated Appwrite Cloud project and add a Web platform for `localhost`.
3. Configure a least-privilege Appwrite server API key and the environment variables in `.env.example`.
4. Run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.

Never commit real environment secrets.
