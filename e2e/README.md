# Connect browser QA

The Playwright suite runs against a dedicated HTTPS staging/preview deployment. It deliberately refuses production hostnames.

## Run locally

```bash
npm install
npx playwright install chromium
CONNECT_BASE_URL=https://your-connect-staging-host.example npm run test:e2e
```

For authenticated member-route coverage, also set `CONNECT_QA_EMAIL` and `CONNECT_QA_PASSWORD` to a dedicated staging-only test account. Do not use a personal or production account. The authenticated test signs in and checks that member feature routes render without server errors; it does not create, delete, or message real members.

## Run in GitHub Actions

Open **Actions → Connect staging browser E2E → Run workflow** and provide the HTTPS staging hostname. Add repository Actions secrets `CONNECT_QA_EMAIL` and `CONNECT_QA_PASSWORD` to enable the authenticated test; without them, that test is reported as skipped and public route checks still run.

The workflow accepts only HTTPS hostnames containing `staging`, `preview`, or `pr-` and rejects the production Connect hostname. Screenshots, traces, videos, and the HTML report are uploaded as a 14-day artifact when generated.

## Scope and limits

The suite covers desktop/mobile Chromium page loads, login/registration form visibility, and optional authenticated route access for Profiles, Friends, Messaging, Dating, Groups, Marketplace, News, Free TV, Videos, and Radio. These are smoke checks, not proof of successful database writes, friend-request delivery, real-time message delivery, purchases, dating matches, group membership changes, or media-provider playback. Those require isolated staging fixtures and dedicated workflow assertions.
