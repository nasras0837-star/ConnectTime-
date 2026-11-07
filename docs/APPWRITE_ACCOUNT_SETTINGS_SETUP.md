# ConnectTime account settings

Create this table in the existing Appwrite database (do not create another database).

- Table ID: choose `member_settings` (or another stable ID).
- Set server environment variable `APPWRITE_MEMBER_SETTINGS_TABLE_ID` to the actual table ID.
- Keep the table private; no public permissions. The Next.js server accesses it with the server-only Appwrite API key.
- Use the authenticated Appwrite user ID as the row ID.

Required columns:
| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| user_id | varchar/string | yes | 128 |
| friend_requests | boolean | yes | in-app notification preference |
| friend_acceptances | boolean | yes | in-app notification preference |
| private_messages | boolean | yes | in-app notification preference |
| product_updates | boolean | yes | in-app notification preference |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Add a unique index on `user_id`. The API allows each signed-in, independently verified active adult to read and update only their own row.

The settings page stores preference choices. Existing friend/message notification producers must consult these settings before creating notifications; until that integration is deployed, do not promise that every toggle suppresses every notification. No email or push notifications are sent.

Profile visibility remains on the profile record and is edited at `/profile`. Photo uploads remain disabled pending a tested quarantine/moderation pipeline. Self-service account deactivation is not implemented; support-assisted closure is the current path. Account deactivation must not be simulated by deleting a profile or changing an unverified client-side flag.
