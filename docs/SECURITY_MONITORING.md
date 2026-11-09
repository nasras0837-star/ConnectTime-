# Connect security and uptime monitoring

This guide records the free monitoring controls configured in the repository and the external setup that still requires an account owner.

## Repository controls

- **CodeQL:** static analysis of JavaScript and TypeScript on pushes, pull requests, and a weekly schedule.
- **Dependabot:** weekly npm and GitHub Actions dependency update/security pull requests.
- **Dependency review:** pull requests fail when newly introduced dependencies have high-severity vulnerabilities or use the blocked licenses configured in the workflow.
- **npm audit:** production dependency audit on pushes, pull requests, and weekly.
- **Connect uptime monitor:** GitHub Actions checks the Render homepage and `/api/auth/status` every 15 minutes, and opens one incident issue if a check fails. It closes that incident after a later successful check.

The scheduled GitHub Actions monitor is a useful free fallback, not a guaranteed real-time SLA. GitHub may delay scheduled workflows during periods of load. It verifies HTTP availability and the shape of the auth-status response; it does not test credentials, complete MFA challenges, or prove that every application feature is secure.

## External free monitoring to enable

### UptimeRobot

Create two HTTPS monitors on the free plan:

1. `https://connect-web-7ypt.onrender.com/`
2. `https://connect-web-7ypt.onrender.com/api/auth/status`

Use an HTTP(s) keyword/status monitor for the second endpoint if available. Set a five-minute interval and configure email alerts to the designated site administrator. Do not configure the monitor to submit credentials or personal data.

UptimeRobot is a separate service and must be connected by an authorized account owner. No API key or external account credentials should be committed to this repository.

### Cloudflare

Cloudflare's edge protections require the production domain's DNS to be managed through Cloudflare with the appropriate proxy setting. The current Render hostname alone is not proof that Cloudflare is in front of the service. Before changing DNS:

1. Confirm the production custom domain and current DNS provider.
2. Add the domain to the correct Cloudflare account.
3. Review imported DNS records carefully.
4. Set the Render origin record to proxied only after confirming the origin hostname and TLS mode.
5. Enable available managed WAF rules and review false positives before enforcing additional custom rules.
6. Keep the Render origin protected against direct-origin bypass where the hosting plan and architecture allow it.

Do not change nameservers, DNS, WAF enforcement, or production routing as part of this repository-only setup. These changes can interrupt the live site and require domain/account-owner approval.

## GitHub security settings to verify

In repository **Settings → Code security and analysis**, enable the available options:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning and push protection (where available for this repository/plan)

In **Settings → Branches** or repository rulesets, protect `main` and require the CI, CodeQL, dependency-review, and security-audit checks before merging. Require MFA for GitHub organization/owner accounts.

## Incident response

- Treat any high-severity CodeQL, dependency, secret-scanning, or uptime alert as requiring human review.
- Rotate exposed credentials immediately; never paste secrets into issues or logs.
- Review Render logs and Appwrite audit/authentication events for suspicious activity.
- Revoke affected sessions and credentials when account compromise is suspected.
- Preserve relevant security logs while limiting access and retention to what is necessary.
- Do not log passwords, MFA codes, recovery codes, cookies, access tokens, government IDs, or private user messages.

## Scope and limitations

These free controls improve detection and response but do not guarantee protection against every attack. They are not a managed 24/7 security operations center. The repository monitor checks availability, not full business-logic security. Authentication, MFA, authorization, age verification, upload quarantine, backups, and incident-response procedures still require separate end-to-end testing and operational ownership.
