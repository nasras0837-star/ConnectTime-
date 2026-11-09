# Connect Security & Trust Baseline

This document tracks controls to implement and verify. It is a checklist, not certification or a claim that controls are deployed.

## Identity and access
- [ ] Require server-side authentication for every private action; never trust client-only checks.
- [ ] Keep accounts pending until an independent age-verification provider confirms 18+ (checkbox/date of birth is not verification).
- [ ] Store verification state only in trusted server-controlled records; users cannot edit it.
- [ ] Require active + verified status for posting, messaging, media publishing, marketplace listings, and Match Maker.
- [ ] Add rate limits, email verification, secure password reset, session revocation, and abuse detection.
- [ ] Use least-privilege credentials; never expose admin/API secrets in browser bundles.

## Database and authorization
- [ ] Deny access by default; enforce authorization server-side and in database rules.
- [ ] Validate ownership and connection status on every read/write.
- [ ] Restrict discovery to verified, active adults; provide privacy controls and block/report.
- [ ] Prevent users changing role, verification, moderation, payout, or account status.
- [ ] Audit privileged/moderation actions; never log passwords, tokens, or sensitive ID data.

## Uploads and quarantine
- [ ] Keep public publishing disabled until scanner tests and release review pass.
- [ ] Upload to private quarantine only; use server-generated object IDs and short-lived authorization.
- [ ] Validate MIME type AND file signature, size, dimensions/duration, and allowed formats server-side.
- [ ] Scan media for malware and prohibited exploitation content with approved providers/processes.
- [ ] Fail closed on scanner timeout/error; delete rejected/abandoned files via cleanup jobs.
- [ ] Never expose quarantined objects; only approved media may be published.
- [ ] Use short-lived signed URLs and check authorization before issuing.
- [ ] Add upload throttles, reporting, evidence preservation, and lawful escalation procedures.

## Browser protections (baseline in next.config.ts)
- CSP (currently includes unsafe-inline; tighten to nonce/hash after audit)
- X-Frame-Options DENY and CSP frame-ancestors none
- X-Content-Type-Options nosniff
- Referrer-Policy strict-origin-when-cross-origin
- Permissions-Policy: camera/microphone same-origin; geolocation disabled
- HSTS (verify production HTTPS and includeSubDomains suitability)
- Strict, Secure, HttpOnly Appwrite session cookie configured at the SSR handler
- X-Permitted-Cross-Domain-Policies, Origin-Agent-Cluster, and Cross-Origin-Opener-Policy headers
- poweredByHeader disabled

## Operational security
- [ ] In Appwrite Console, verify email, enable session alerts, enforce strong password policy, review rate limits and allowed origins.
- [ ] Verify MFA enrollment and challenge flows end-to-end with TOTP, verified email/phone factors, and recovery codes.
- [ ] Require MFA for GitHub, hosting, Appwrite, and privileged staff accounts.
- [ ] Protect main branch; require CI checks and review for production changes.
- [ ] Run dependency audit, secret scanning, SAST, and security-header checks in CI.
- [ ] Separate development/staging/production projects and secrets.
- [ ] Backups, tested restoration, incident response, vulnerability disclosure, retention/deletion.
- [ ] Privacy policy, terms, community standards, reporting/appeals, and country legal review.

## Release gates
- [ ] Age verification/account-state tests pass.
- [ ] Authorization tests cover cross-user access and unverified accounts.
- [ ] Quarantine/scanner/cleanup tests pass.
- [ ] CI lint, typecheck, build, dependency audit, and security tests pass.
- [ ] Production configuration reviewed; no secrets/debug endpoints exposed.

## Authentication architecture note
Connect's current sign-in flow uses Appwrite Authentication with the Appwrite React SSR handler. MFA UI is added for TOTP enrollment, verified email/phone challenges, and one-time recovery codes; end-to-end deployment testing remains required. Verify the deployed Appwrite project configuration, domain allowlist, email delivery, MFA factors, session alerts, and server-side authorization before treating these controls as production-ready.
