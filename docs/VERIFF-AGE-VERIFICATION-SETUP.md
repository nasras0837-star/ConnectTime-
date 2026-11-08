# Connect Veriff age-verification setup

This guide describes the server integration. It does not mean production credentials or the Appwrite table have been configured.

## Render environment variables

Set these server-side values on the Connect Render web service:

- `VERIFF_BASE_URL`: exact base URL shown in the Veriff integration's API Keys page (HTTPS, without `/v1`).
- `VERIFF_API_KEY`: Veriff API key (sent as `X-AUTH-CLIENT`).
- `VERIFF_SHARED_SECRET`: Veriff shared secret used to validate `X-HMAC-SIGNATURE`.
- `VERIFF_CALLBACK_URL`: `https://connect-web-7ypt.onrender.com/api/verification/webhook` after confirming that hostname is the intended production hostname.
- `APPWRITE_VERIFICATION_RECORDS_TABLE_ID`: ID of the private verification records table.

Existing required variables: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_ACCESS_DATABASE_ID`, and `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`.

## Appwrite verification records table

Create a private table named `verification_records` in the existing Connect database. Columns:

| Column | Type | Required |
|---|---|---|
| `user_id` | String (128) | Yes |
| `provider` | String (24) | Yes |
| `provider_session_id` | String (128) | Yes |
| `verification_url` | URL or String (2048) | Yes |
| `status` | String (24) | Yes |
| `verified_at` | Datetime | No |
| `created_at` | Datetime | Yes |
| `updated_at` | Datetime | Yes |

Add indexes for `provider_session_id`, `user_id + status`, and `provider + provider_session_id`. Keep all permissions private; the server API key is the only writer.

The existing member access collection remains server-owned. Document IDs must equal Appwrite user IDs, with `adult_status` and `account_status` fields as defined in `APPWRITE_AUTHORIZATION.md`.

## Veriff Customer Portal

1. Use a Veriff test integration first.
2. Configure its decision webhook URL to the callback URL above.
3. Add the API key and shared secret only to Render's server environment; never commit them or put them in `NEXT_PUBLIC_*` variables.
4. The session endpoint creates a session with `vendorData` and `endUserId` set to the authenticated Appwrite user ID.
5. Veriff's decision webhook must include the session ID and vendor data. Connect verifies the HMAC-SHA256 signature over the raw request body and requires a matching pending session record.
6. Connect only sets `adult_status=verified` when the decision is approved and the verified date of birth proves the user is at least 18. Missing or invalid DOB is routed to review; under-18 or declined/expired/abandoned decisions are rejected.

## Endpoints

- `POST /api/verification/session`: authenticated session creation; returns the hosted verification URL.
- `POST /api/verification/webhook`: signed Veriff decision webhook; no browser authentication.

## Release gate

Do not consider age verification production-ready until:
- The table and all Render variables are configured.
- Veriff's webhook points to the production URL.
- Test approved (18+), under-18, declined, resubmission, expired, duplicate, bad-signature, unknown-session, and Appwrite-outage cases pass.
- The callback's HMAC signature is checked against a real test webhook in Veriff's portal.
- A second test account confirms the resulting member-access isolation.

No raw ID images, full DOB, name, or provider PII is stored by this integration. Uploads and public publishing remain disabled pending their separate quarantine and moderation release gate.
