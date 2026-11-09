# Connect Appwrite production security checklist

This guide is required before enabling production sign-in or declaring account protection complete.

## Project and platform restrictions
- In Appwrite Console, open the Connect production project.
- Add only the production Connect hostname and the exact approved preview hostname under Platforms. Remove unused or wildcard platform entries.
- Confirm the Appwrite endpoint is HTTPS and the project ID matches the production project.
- Keep `APPWRITE_API_KEY` server-side in Render environment settings. Never use a `NEXT_PUBLIC_` prefix for it.
- Create a dedicated SSR API key with only the scopes required by the Appwrite React handler: `users.read`, `users.write`, and `sessions.write`. Review other server routes before removing scopes they legitimately need.

## Account protection
- Enable email verification and configure the verification email template.
- Add the production Connect URL to the allowed redirect URLs, including `/account/settings` for the email verification return.
- Enforce a strong password policy and prevent passwords containing the member's personal information.
- Enable Appwrite session alerts so members receive notice of new sign-ins.
- Review Appwrite's authentication rate limits and abuse controls. Keep failed-login protection enabled; monitor suspicious sign-in patterns.
- Encourage members to enable MFA in Connect Account Settings. The app supports TOTP authenticator codes, verified email or phone factors where configured, and one-time recovery codes.
- Require MFA for all Appwrite Console, GitHub, Render, and other privileged operator accounts.

## Data access and privacy
- Review every Appwrite database/table/collection and Storage bucket. Default permissions to deny; grant only the minimum per-user or server permissions required.
- Do not expose admin API keys or server secrets to browser code.
- Confirm server routes derive the member identity from the authenticated Appwrite session, not from a user ID supplied in request JSON.
- Test that one member cannot read, update, delete, or enumerate another member's private profile, messages, settings, or uploads.
- Keep unapproved media private and keep production publishing disabled until the moderation/quarantine release gates pass.
- Enable backups and test restoration. Define retention and deletion procedures for account data.

## Release tests
- Sign in with password only when MFA is disabled.
- Enable TOTP plus a verified email or phone factor, then test a fresh sign-in requiring the second factor.
- Test email, phone, TOTP, and recovery-code challenges only for factors that are verified and enabled for that account.
- Verify recovery codes are one-time use and are displayed only once.
- Test logout, session expiry, password reset, and revocation of old sessions.
- Test cross-origin POST requests are rejected by the Next.js Appwrite handler.
- Run lint, typecheck, unit tests, production build, dependency audit, and CodeQL before release.

## Current application controls
- Appwrite SSR session cookies are configured Secure, HttpOnly, and SameSite=Strict.
- The Appwrite authentication handler rejects cross-site POST requests.
- Next.js response headers include CSP, frame denial, MIME sniffing protection, HSTS, referrer policy, permissions policy, and additional cross-origin controls.
- GitHub Actions runs dependency audit and CodeQL analysis.
- MFA enrollment and challenge interfaces are implemented in the application; they still require a configured Appwrite project and live end-to-end verification.

These controls reduce risk but cannot guarantee that a website is impossible to compromise. Keep dependencies, hosting configuration, Appwrite policies, and incident response procedures under regular review.
