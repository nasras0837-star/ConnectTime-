# Connect notifications — Appwrite setup

Create a table named `notifications` in the existing database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Set Netlify environment variable `APPWRITE_NOTIFICATIONS_TABLE_ID` to its exact table ID.

Keep the table private. Do not grant public table or row permissions; all reads and writes use the server-only `APPWRITE_API_KEY`.

Required columns:
| Column ID | Type | Required | Size |
|---|---|---:|---:|
| recipient_user_id | varchar/string | yes | 128 |
| actor_user_id | varchar/string | yes | 128 |
| type | varchar/string | yes | 40 |
| message | varchar/string | yes | 180 |
| reference_id | varchar/string | no | 128 |
| is_read | boolean | yes | — |
| created_at | varchar/string | yes | 40 |

Recommended indexes:
- `recipient_user_id`
- `recipient_user_id + created_at`
- `recipient_user_id + is_read`

## Behavior

- The signed-in recipient can list only their own notifications and mark only their own notification as read.
- The API requires verified-adult and active-account status.
- A new friend request creates a notification for the recipient; accepting creates a notification for the original sender.
- Notification write failures do not undo a successfully saved friend request.
- Notifications are currently in-app only; there is no email, push, or real-time delivery.
- Until this table is configured, friend requests continue to work but notification storage is unavailable.
