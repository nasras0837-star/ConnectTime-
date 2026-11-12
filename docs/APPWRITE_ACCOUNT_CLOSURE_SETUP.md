# Appwrite account closure requests

Create a private table in the existing Appwrite database. Do not create a new database.

- Suggested table ID: `account_closure_requests`.
- Set server environment variable `APPWRITE_ACCOUNT_CLOSURE_REQUESTS_TABLE_ID` to the actual table ID.
- Keep all permissions private; access the table only through the server-side Appwrite API key.
- Do not grant client-side read/write access.

Required columns:

| Column ID | Type | Required | Notes |
|---|---|---:|---|
| user_id | varchar/string | yes | Authenticated Appwrite user ID |
| reason | varchar/string | no | Maximum 500 characters |
| status | varchar/string | yes | Initially `pending_review` |
| requested_at | varchar/string | yes | ISO timestamp |

Recommended indexes: key index on `user_id`; key index on `status`. If Appwrite requires a composite index for the API query, add a composite key on `user_id,status`.

The API requires same-origin POST, a signed-in member with verified adult access, and explicit confirmation. It prevents a second simultaneous pending request for the same user. Submission only creates a review request; it does not disable login, delete data, or cancel subscriptions. Staff must verify the request, process applicable retention/legal obligations, and then separately perform any approved deactivation or deletion. Do not promise immediate account removal based on submission.
