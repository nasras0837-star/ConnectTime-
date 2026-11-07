# Deploy the current ConnectTime application preview

The current application lives in the repository root under `app/` and is a Next.js 16 application. The old GitHub Pages workflow publishes only `docs/`, which is a separate static prototype. It does not publish the current Next.js app.

## Recommended preview host: Vercel

1. Sign in to [Vercel](https://vercel.com/) using the GitHub account that can access `nasras0837-star/ConnectTime-`.
2. Choose **Add New → Project** and import **ConnectTime-**.
3. Keep the project root directory as `./` (repository root).
4. Confirm the framework is **Next.js**. Keep the detected build command `npm run build` and output settings at their defaults.
5. For a visual-only preview, Appwrite environment variables can be left unset. The site will show the current UI, but authentication and server-backed features will remain unavailable.
6. Select **Deploy**. Vercel will build the current `main` branch and provide a preview URL. Future pushes to `main` will trigger new deployments automatically.

## Appwrite configuration (later)

When the dedicated ConnectTime Appwrite project is ready, add the variables from `.env.example` in Vercel → Project → Settings → Environment Variables. Never add `APPWRITE_API_KEY`, verification secrets, or other server secrets to a `NEXT_PUBLIC_*` variable or commit them to Git.

## What this preview is and is not

- It previews the current Next.js interface, not the old `docs/index.html` static demo.
- A successful Vercel deployment does not mean Appwrite is configured.
- User accounts, age verification, persistent posts/events, uploads, moderation, messaging, calls, and payments must not be treated as production-ready until their backend services and safeguards are implemented and tested.
- The existing GitHub Pages URL may continue to show the old static prototype. Use the Vercel URL for the current Next.js preview.
