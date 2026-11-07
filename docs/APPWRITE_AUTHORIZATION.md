# ConnectTime Appwrite authorization design and implementation gates

## Status
The current app uses Appwrite Auth through `@appwrite.io/react`. The account page deliberately displays a pending state; there is no independent age-verification integration or server-owned eligibility record yet. Do not unlock platform features based on the signup checkbox.

## Current code status\n- `lib/access-policy.ts` implements the strict `verified` + `active` decision and has unit tests.\n- `lib/member-access.ts` resolves the signed-in Appwrite user server-side and reads their server-owned access document; missing configuration/records and Appwrite errors deny access.\n- `GET /api/member-access` exposes only a minimal authorization result and sends `Cache-Control: no-store`.\n- The account page now reflects the server-side authorization result.\n- These are foundation controls only: no social, messaging, marketplace, dating, publishing, or calls feature endpoints exist yet to wire to this gate. The age provider/webhook is not configured.\n\n## Required server-owned access record
Create an Appwrite Database collection (suggested ID: `member_access`) with document ID equal to the authenticated Appwrite user ID. Fields:
- `adult_status`: pending | verified | rejected | review
- `account_status`: pending | active | suspended | banned
- `verification_provider`: provider identifier (no raw identity document)
- `verified_at`: timestamp
- `review_reason_code`: optional non-sensitive code

Permissions:
- no client create/update/delete permissions on this collection
- users may read only their own minimal status if necessary
- only a server-side Function using a restricted API key may write status
- never allow a user to self-set `verified` or `active`

## Authorization contract
Every server action, route handler, and data access path for posts, comments, friend requests, messaging, Match Maker, marketplace, creator publishing, live streams, and calls must:
1. Resolve the current Appwrite session on the server (not from a client-supplied user ID).
2. Load the user's access record using server-only credentials.
3. Require `adult_status === "verified"` AND `account_status === "active"`.
4. Verify ownership, accepted connection, privacy/block rules, and resource-specific permissions.
5. Return 401 when unauthenticated and 403 when pending/rejected/suspended.
6. Fail closed if the access record or provider is unavailable.
7. Rate-limit sensitive actions and log security events without secrets or identity documents.

## Age-verification integration
- Choose a reputable independent 18+ verification provider and complete privacy/legal review.
- Provider callbacks/webhooks must verify signatures, timestamp/replay protections, and provider transaction IDs.
- Keep the result/status only; avoid retaining ID images or face templates unless strictly necessary and legally approved.
- Test pending, verified, rejected, manual-review, expired/revoked, and provider outage states.
- A DOB, checkbox, or age-estimation model alone is not sufficient to establish adult eligibility.

## Appwrite deployment secrets
Set these only in server-side deployment settings:
- `APPWRITE_API_KEY` (least privilege; never NEXT_PUBLIC)
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`
- `AGE_VERIFICATION_WEBHOOK_SECRET` (after provider selection)
Public client values may include endpoint and project ID only.

## Tests required before enabling features
- Anonymous access is denied for private endpoints.
- Pending/rejected adult status cannot read/write social or creator resources.
- Active verified adult can only access own resources and allowed connected users.
- User cannot change access status, role, or verification fields.
- Blocked users cannot message or discover one another.
- Missing Appwrite config, missing status, provider failure, or database outage fails closed.
- Rate limits and webhook replay/signature checks are tested.

## Important
This document specifies the intended control design. It does not claim the Appwrite collection, age provider, webhook, or authorization gates are deployed. All new features remain gated until implementation and tests pass.
