# ConnectTime adult verification integration

## Provider decision

**Yoti Age Verification Service is the selected provider for sandbox evaluation**, subject to Techcyber LLC completing vendor onboarding, privacy/legal review, pricing review, and approval of the production contract. This is not evidence that a Yoti account, API credentials, or production service has been activated.

The initial integration target is an **OVER 18** check. Prefer privacy-preserving age-threshold proof that returns only whether the threshold was met. Do not request or store a user's exact age unless a documented product/legal requirement makes it necessary.

Yoti's production Age Verification API and its isolated sandbox use different authentication and session endpoints. Do not mix the two flows. The production API uses the Yoti Hub API key as a bearer token. The sandbox requires a short-lived OAuth access token obtained by signing a PS384 client-assertion JWT with the Yoti service private key:
- Sandbox introduction: https://developers.yoti.com/age-verification/sandbox-introduction
- Sandbox integration guide (OAuth): https://developers.yoti.com/age-verification/sandbox-integration-guide
- Sandbox session creation: https://developers.yoti.com/age-verification/create-sandbox-session
- Sandbox notifications: https://developers.yoti.com/age-verification/sandbox-notifications
- Production API reference (not used by this sandbox adapter): https://developers.yoti.com/age-verification-api
- Create a session: https://developers.yoti.com/age-verification/create-a-session
- Results: https://developers.yoti.com/age-verification/results
- Notifications and signature verification: https://developers.yoti.com/age-verification/notifications

## Integration contract

### Session creation

1. Require an authenticated Appwrite user. Apply per-user and per-IP rate limits.
2. Create an opaque, random, single-use internal reference mapped server-side to the Appwrite user ID. Do not put email, name, or other personal information in Yoti's reference_id.
3. For sandbox only, generate a short-lived JWT client assertion (PS384; `iss` and `sub` are `sdk:<YOTI_SDK_ID>`, `aud` is `https://auth.api.yoti.com/v1/oauth/token`, with `iat`, `exp`, and unique `jti`), exchange it at `POST https://auth.api.yoti.com/v1/oauth/token` using the `client_credentials` grant and `avs:sessions:create` scope, then use the returned bearer token with `POST https://age.yoti.com/sandbox/api/v1/sessions` and `Yoti-SDK-Id`. Keep the private key and access token server-only; cache the token until shortly before expiry.
4. Configure `type: OVER`, threshold 18, short session TTL, and only methods approved in the vendor contract and privacy review. Do not enable age estimation as the sole verification method for access to ConnectTime's protected social features.
5. Supply HTTPS callback and notification URLs. Keep the Yoti session ID and internal reference mapped to the initiating user in a private server-owned store.
6. Return only the sandbox-hosted Yoti flow URL and an opaque session reference to the signed-in user. The sandbox session is not a real age check and must never grant production access. Never expose credentials.
7. Redirect the user to Yoti's hosted flow. A browser redirect or query parameter is not proof of a pass.

### Result and notification handling

- Yoti documents the notification payload with `session_key`, `reference_id`, `state`, `sequence_number`, `timestamp`, and `signature`.
- Verify the notification signature over the exact canonicalized payload as specified by Yoti, using the official published Yoti Age Verification public key and RSA-PSS/SHA-256. Exclude the `signature` and `sequence_number` fields exactly as documented. Do not invent a signature format or use a generic HMAC comparison.
- Enforce timestamp/replay windows, notification ID/evidence ID idempotency, expected SDK/service, session mapping, and reference mapping. Handle retries and multiple sequence numbers safely.
- After a valid notification, retrieve the session result server-to-server from Yoti's result endpoint and verify its session ID, configured type `OVER`, threshold 18, SDK ID, and terminal state. Do not use the deprecated notification `result` boolean as the sole decision.
- Only a verified `COMPLETE` result for the expected OVER-18 session may set `adult_status=verified`. `FAIL`, `ERROR`, `CANCELLED`, `EXPIRED`, pending, unknown states, invalid signatures, mismatched sessions, or provider outages must never set verified.
- A successful age result does not activate the account. Keep `account_status=pending` until the separate account activation/moderation policy is satisfied.
- Store only minimal audit metadata (provider, session reference, event/evidence ID, decision, timestamp). Do not store ID scans, face images, biometric templates, exact birth date, or exact age in ConnectTime's member-access record.

### Endpoint contract

- `POST /api/verification/session`: authenticated, rate-limited; creates a Yoti session and returns its hosted URL.
- `POST /api/verification/webhook`: public HTTPS endpoint; accepts only cryptographically verified Yoti notifications and is idempotent.
- `GET /api/verification/status`: authenticated; returns only the current user's minimal status.
- Callback/return route: informational only; it must never mark a user verified based on browser-supplied parameters.

## Environment configuration

After Yoti onboarding and sandbox access are approved, configure these as server-only Netlify environment variables:

- `YOTI_API_KEY`
- `YOTI_SDK_ID`

Do not add either variable with a `NEXT_PUBLIC_` prefix. Do not commit credentials or ask users to paste them into chat. The notification verifier must use Yoti's official published Age Verification public key, pinned and reviewed in code/configuration according to Yoti's current documentation; do not accept a public key supplied by the webhook.

Until the Yoti sandbox SDK ID and private key are configured and the sandbox adapter is implemented and tested, the session endpoint must continue returning 503. Sandbox results must be stored separately from production member-access state and must never set `adult_status=verified`. The existing `AGE_VERIFICATION_PROVIDER` placeholder is not a live integration switch.

## Tests and release gates

- Valid signed OVER-18 notification and matching fetched COMPLETE result updates only the correct user's access record.
- Valid FAIL, ERROR, CANCELLED, EXPIRED, pending, and unknown states never verify.
- Invalid signature, modified body, stale timestamp, replayed notification, duplicate evidence, wrong SDK ID, unknown session, mismatched reference, and provider outage never verify.
- A callback URL or browser-supplied session ID alone never verifies.
- User cannot edit their own adult/account status through client APIs.
- Account activation remains separate from adult verification.
- Logs contain no API key, ID image, ID number, exact age, face image, or biometric template.
- Run vendor sandbox, staging, cross-user isolation, and failure-path tests before enabling any protected production feature.

## Current implementation status

The provider decision is recorded for sandbox evaluation only. Vendor onboarding and credentials, the Yoti sandbox session adapter, sandbox result retrieval, signature-verified webhook, persistent session/event storage, and end-to-end tests are not yet implemented. The existing verification session endpoint intentionally remains unavailable. Protected ConnectTime member features must remain fail-closed until all release gates pass.
