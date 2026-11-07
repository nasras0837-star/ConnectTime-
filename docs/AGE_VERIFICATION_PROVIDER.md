# ConnectTime adult verification integration

## Provider selection
Provider has not yet been contracted or configured. The integration is provider-neutral until an approved vendor is selected. Do not accept a checkbox, date of birth, client request, or uploaded image as verified adult status.

## Required verification flow
1. Signed-in user requests verification from a server endpoint.
2. Server creates a provider verification session tied to the authenticated Appwrite user ID using server credentials.
3. Browser redirects/opens provider's hosted verification flow; ConnectTime does not collect ID scans or face biometrics itself.
4. Provider sends a signed webhook to a server endpoint.
5. Webhook handler validates signature against raw request bytes, timestamp/replay window, event ID/idempotency, expected environment, and final adult result.
6. Server maps provider subject/session to the initiating Appwrite user (never trust a user ID supplied in the webhook body without matching the server-created session).
7. Server updates the access document through a least-privilege server key: adult_status=verified only on provider-confirmed adult pass; otherwise rejected/review/pending. Account remains pending until moderation/activation policy is satisfied.
8. Record minimal audit metadata only (provider event ID, status, timestamp, decision); do not store identity images, ID numbers, or biometric templates unless a documented legal necessity and vendor design require it.
9. Return generic responses; never expose provider secrets or verification artifacts.

## Endpoint contract (implementation pending provider choice)
- POST /api/verification/session: authenticated; rate limited; creates a server-side provider session and returns only its hosted URL/session reference.
- POST /api/verification/webhook: public network endpoint, but cryptographically authenticated by provider signature; idempotent and replay resistant.
- GET /api/verification/status: authenticated; returns only the member's status.

## Tests/release gates
- Invalid signature, expired timestamp, duplicate event, wrong environment, unknown session, underage result, inconclusive result, and provider outage never set verified.
- Valid adult pass changes only the correct user record.
- User cannot edit their own adult/account status through client APIs.
- Logs contain no ID image, ID number, face image, biometric template, or provider secret.
- Test provider sandbox and staging before production. Production restricted features remain unavailable until provider is selected, credentials are configured, and webhook tests pass.
