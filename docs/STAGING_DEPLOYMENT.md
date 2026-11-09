# ConnectTime staging and production workflow

## Branches

- `staging` is the integration and acceptance-test branch.
- `main` is production. Do not merge into `main` until staging checks and acceptance tests pass.
- Feature and fix branches should target `staging` first. Promote the tested staging commit to `main` with a reviewed pull request.

## Environment isolation

The staging web service must use a dedicated Appwrite test project, test database/tables, test API key, and test provider credentials. Never copy production credentials or production member data into staging. Use synthetic test accounts and data only. Keep all server credentials out of `NEXT_PUBLIC_*` variables and out of Git.

Production continues to use the existing `connect-web` Render service and its current Appwrite production project. Do not change its service, domain, environment variables, or auto-deploy settings as part of staging setup.

## Staging service

Use `render-staging.yaml` to create a separate Render service named `connect-web-staging` from branch `staging`. Supply staging-only values for every manual environment variable before applying the Blueprint. The service health check is `/api/auth/status`. Do not point staging at the production Appwrite project.

## Promotion gates

Before promotion to `main`:

1. GitHub Actions passes tests, typecheck, lint, and production build on the staging branch.
2. Deploy the staging service and confirm `/api/auth/status` is healthy.
3. Test registration, sign-in, sign-out, session persistence, and password reset with synthetic test accounts.
4. Test member access, privacy, blocks/reports, and authorization boundaries with separate test accounts.
5. Confirm unfinished age verification, uploads/publishing, payments, advertising, and moderation enforcement remain disabled unless separately approved and validated.
6. Open a pull request from `staging` to `main`; review the diff and checks before merging.

## Rollback

Keep the previous known-good production deploy available in Render. If a production deployment fails, use Render's rollback/redeploy controls to restore that deploy, then fix the issue on a feature branch and repeat the staging gates. Never roll staging credentials or data into production.
