# Connect Appwrite authorization

## Implemented code (foundation only)
- `lib/access-policy.ts`: member eligible only if `adult_status=verified` AND `account_status=active`.
- `lib/member-access.ts`: server resolves logged-in Appwrite user and reads their server-owned access document. Missing config, record, or any Appwrite error denies access.
- `GET /api/member-access` and `GET /api/verification/status`: minimal no-store endpoints.
- `POST /api/verification/session`: creates a Veriff hosted session for the authenticated user and stores its session ID in a private verification table.
- `POST /api/verification/webhook`: verifies Veriff HMAC-SHA256 over the raw body, binds the decision to a stored session and user, and updates member eligibility only for an approved decision with a valid date of birth showing age 18 or older.
- Account page reflects server authorization. Unit tests cover eligibility/denial.

## Access collection
Create server-owned Appwrite collection `member_access`:
- Document ID exactly Appwrite user ID.
- `adult_status`: pending/verified/rejected/review.
- `account_status`: pending/active/suspended/banned.
- No client create/update/delete permissions; no broad read.
- Server key with minimum database read/write scopes; only trusted server/webhook may write statuses.

## Age verification
Provider is not selected/configured. See `docs/AGE_VERIFICATION_PROVIDER.md`. The signup 18+ checkbox is not verification. The session endpoint remains unavailable until provider-specific API and signed webhook handling are implemented.

## Feature enforcement (pending)
No production social, messaging, Match Maker, marketplace, publishing, creator, or calls APIs are released yet. Every future server route/action must call `checkMemberAccess()` before access, then enforce ownership, connections, blocks, and moderation. UI checks alone are not authorization. Keep features disabled until tests exist.

## Release checklist
- [ ] Appwrite project/access DB/collection and least-privilege credentials configured.
- [ ] Select age provider; configure sandbox.
- [ ] Signed webhook: raw-body signature, replay protection, idempotency, session-to-user binding.
- [ ] Test pass/fail/underage/inconclusive/outage paths.
- [ ] Wire each feature API and test cross-user access.
- [ ] CI, secrets, backups, privacy/legal review complete.
