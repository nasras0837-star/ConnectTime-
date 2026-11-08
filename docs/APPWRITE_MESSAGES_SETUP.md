# Connect private messaging — Appwrite setup

Create a `messages` table in the existing database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Set the Render environment variable `APPWRITE_MESSAGES_TABLE_ID` to its exact table ID.

Keep the table private. Do not grant public table or row permissions. All operations use the server-only `APPWRITE_API_KEY`.

Required columns:

| Column ID | Type | Required | Size |
|---|---|---:|---:|
| sender_user_id | varchar/string | yes | 128 |
| recipient_user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 2000 |
| is_read | boolean | yes | — |
| created_at | varchar/string | yes | 40 |

Recommended indexes:
- `sender_user_id`
- `recipient_user_id`
- `sender_user_id + recipient_user_id + created_at`
- `recipient_user_id + is_read`
- `created_at`

Required existing configuration:
- `APPWRITE_PROFILES_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`
- `APPWRITE_FRIEND_REQUESTS_TABLE_ID`
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`
- `APPWRITE_NOTIFICATIONS_TABLE_ID` (optional; new-message alerts are skipped if absent)

## Safety and behavior

- Messaging requires a signed-in member whose server-side access record confirms verified-adult eligibility and an active account.
- Both members must have an accepted friend request, be independently eligible, and have no block in either direction.
- The API resolves recipients by handle; it does not accept client-supplied user IDs.
- Messages are plain text, limited to 2,000 characters, and rendered as text (not HTML).
- Each member can only access conversations in which they are a participant.
- The recipient can mark only messages in their own conversation as read; senders see a basic Sent/Read receipt.
- Inbox and conversation responses are private and sent with no-store caching.
- Sending is throttled to 20 messages per member per rolling minute as a basic application-level control; this is not a distributed rate limiter and should be supplemented with edge/WAF protection before public launch.
- Recipients can submit a private report against an individual message through the existing community report workflow.
- Private inboxes support starting a conversation by handle, conversation previews, unread counts, read receipts, message reporting, and automatic refresh while the page is visible.
- Delivery is request/refresh based (about every 8 seconds), not WebSocket or push delivery. Typing indicators, message edit/delete, reactions, voice/video calls, and file/photo attachments are not implemented in private messages.
- Community group chat is a separate feature with its own `APPWRITE_COMMUNITY_GROUP_MESSAGES_TABLE_ID` table and `/groups/:groupId` discussion page. See `GROUP_CHAT_SETUP.md`.
- Keep the feature unavailable until the table and all required environment variables are configured.
