# Deploy Connect to Netlify

The current Connect application is the Next.js 16 app in the repository root. Use Netlify for the full application. The GitHub Pages workflow publishes only `docs/`, which is a separate static visual preview.

## 1. Connect the GitHub repository

1. Open the [Connect Netlify deploy dashboard](https://app.netlify.com/projects/connecttime-sm/deploys).
2. If the site is not linked to GitHub yet, choose **Add new project** / **Import an existing project** and select `nasras0837-star/Connect-`.
3. Select `main` as the production branch.
4. Set the base directory to the repository root (leave it blank).
5. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `22`
6. Save the settings and start the first production deploy.

The repository's `netlify.toml` supplies the build command, publish directory, and Node version. Netlify supports Next.js 16 through its automatically managed OpenNext adapter; do not install or pin a separate adapter unless troubleshooting specifically requires it.

## 2. Configure environment variables

For a visual-only preview, Appwrite variables may be left unset; account features will remain unavailable. For live AI responses, add `OPENAI_API_KEY` as a server-side environment variable in Netlify. Never paste the key into chat, source files, or GitHub.

When the dedicated Connect Appwrite project is ready, add the variables from `.env.example` in Netlify → Site configuration → Environment variables. Keep `APPWRITE_API_KEY` and all verification secrets server-only. Do not prefix them with `NEXT_PUBLIC_`.

Any environment-variable change requires a new deploy before it reaches the live site and its functions.

## 3. Confirm deployment

Open the deploy dashboard and wait for the production deploy to show **Published**. If it fails, open that deploy and copy the first actual error from the Deploy log (do not share secret values). A Netlify site URL can return a 404 until a successful deploy has been published.

## 4. What the preview does not mean

A successful website deploy does not mean Appwrite is configured or that the platform is production-ready. Signup/login, independent adult verification, persistent social data, uploads, moderation, messaging, calls, creator publishing, marketplace payments, advertising billing, and analytics need their respective secure backend implementations and tests before launch.

## 5. GitHub Pages is a separate static preview

The Pages workflow publishes only `docs/` and does not deploy the Next.js application. Expected URL: https://nasras0837-star.github.io/ConnectTime-/
