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
| dating_likes | boolean | yes | in-app dating like and match notifications |
| product_updates | boolean | yes | in-app notification preference |
| live_feed_topics | varchar/string | no | 500; JSON array of selected live-feed topics |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Add a unique index on `user_id`. The API allows each signed-in, independently verified active adult to read and update only their own row.

The settings page stores preference choices. Friend-request, friend-acceptance, private-message, and dating-like notification producers consult these settings before creating notifications. Product updates are reserved for future platform announcements. No email or push notifications are sent.

Profile visibility remains on the profile record and is edited at `/profile`. Photo uploads remain disabled pending a tested quarantine/moderation pipeline. Self-service account deactivation is not implemented; support-assisted closure is the current path. Account deactivation must not be simulated by deleting a profile or changing an unverified client-side flag.


The personalized main-page live feed stores topic selections in `live_feed_topics` on the same private member-settings row. Add this optional string column (500 characters). The `/api/live-feed/preferences` endpoint requires a signed-in member with verified adult eligibility, validates topic names, and updates only the current member's row. When a member has no settings row yet, it creates one with the notification defaults and their selected topics. Local browser preferences remain a fallback when the account is signed out or the table is not configured.
