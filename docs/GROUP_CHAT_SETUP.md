# ConnectTime Community Group Chat Setup

Community group chat uses the existing Appwrite database configured by `APPWRITE_DATABASE_ID` and a dedicated TablesDB table.

## Required environment variable

Set `APPWRITE_COMMUNITY_GROUP_MESSAGES_TABLE_ID` to the ID of the new group messages table. Keep the Appwrite API key server-side; do not expose it through a `NEXT_PUBLIC_` variable.

## Create the table

In the existing ConnectTime Appwrite database, create a table named **Community Group Messages**. Suggested table ID: `community_group_messages` (use a different ID if that ID is already taken, then set the environment variable to the actual ID).

Add these columns:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `group_id` | String | Yes | Group row ID |
| `author_user_id` | String | Yes | Authenticated sender's Appwrite user ID |
| `body` | String / Text | Yes | Message text, max 2,000 characters enforced by API |
| `created_at` | DateTime | Yes | UTC ISO timestamp |

Recommended indexes:
- `group_id` + `created_at` (key: `group_created_at`) for ordered group history.
- `author_user_id` + `created_at` (key: `author_created_at`) for sender rate limiting.

The server uses the existing Appwrite service API key to read and write rows. Table permissions should not grant anonymous or ordinary client-side write access; all message operations go through the authenticated Next.js API routes.

## Features and safeguards

- Only signed-in, verified adult members in good standing can use group chat.
- The user must have an active membership in the requested group.
- Private group chat is not available to non-members.
- Messages are text-only and limited to 2,000 characters.
- Per-sender rate limit: 20 messages per minute.
- Messages from users blocked by the viewer (or who blocked the viewer) are hidden from that viewer.
- New-message notifications are attempted for active group members when the notifications table is configured.
- The interface refreshes on page load and when the user selects Refresh chat. This is not realtime WebSocket messaging yet.

## Routes

- `GET /api/community/groups/:groupId/messages` — list the latest 100 messages.
- `POST /api/community/groups/:groupId/messages` — send a message.

After setting the table ID and columns in the existing Appwrite database, deploy the Next.js app to enable group chat.
