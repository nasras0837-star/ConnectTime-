# Connect friend requests — Appwrite setup

Create a new table named `friend_requests` in the existing Appwrite database configured by `APPWRITE_DATABASE_ID`. Do not create another database.

Set Netlify environment variable `APPWRITE_FRIEND_REQUESTS_TABLE_ID` to the table's exact ID. Keep the table private; do not grant public table or row permissions. The server-only Appwrite API key performs all operations.

Required columns (all varchar/string):
| Column ID | Required | Size |
|---|---:|---:|
| sender_user_id | yes | 128 |
| recipient_user_id | yes | 128 |
| status | yes | 20 |
| created_at | yes | 40 |
| updated_at | yes | 40 |

Recommended indexes:
- `sender_user_id`
- `recipient_user_id`
- `sender_user_id + recipient_user_id`
- `recipient_user_id + status`
- `sender_user_id + status`

Existing configuration also required:
- `APPWRITE_PROFILES_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`
- `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `NEXT_PUBLIC_APPWRITE_ENDPOINT`, and `NEXT_PUBLIC_APPWRITE_PROJECT_ID`

## Rules enforced by the server

- Only signed-in members with independently verified adult status and active account status can list, send, accept, decline, or cancel requests.
- The recipient must also have verified adult and active status and a discoverable profile.
- Requests are blocked if either member has blocked the other.
- Existing connections and duplicate pending requests are rejected or treated idempotently.
- Only the recipient can accept or decline; only the sender can cancel.
- The API returns profile display fields, not user IDs or verification records.
- Friend requests are not real-time notifications. Add a notification system and request rate limiting before broad launch.
