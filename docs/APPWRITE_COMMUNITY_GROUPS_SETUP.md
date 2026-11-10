# Connect community groups — Appwrite setup

Use the existing Appwrite database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Create three private TablesDB tables and keep all permissions server-only (no public read/write permissions). Configure these server environment variables:

- `APPWRITE_COMMUNITY_GROUPS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_MESSAGES_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID` (shared community block-controls table)

## `community_groups`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| owner_user_id | varchar/string | yes | 128 |
| name | varchar/string | yes | 70 |
| description | varchar/string | no | 500 |
| privacy | varchar/string | yes | 20; `public`, `members`, or `private` |
| membership | varchar/string | yes | 20; `open` or `approval` |
| status | varchar/string | yes | 20; initial `active` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Indexes: `status + created_at`, `owner_user_id + created_at`.

## `community_group_members`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| group_id | varchar/string | yes | 128 |
| user_id | varchar/string | yes | 128 |
| role | varchar/string | yes | 20; `owner` or `member` |
| status | varchar/string | yes | 20; `active`, `pending`, `invited`, `declined`, `removed`, or `left` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Indexes: `group_id + user_id` (unique), `user_id + status`, `group_id + status`.

## `community_group_posts`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| group_id | varchar/string | yes | 128 |
| author_user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 1500 |
| status | varchar/string | yes | 20; initial `published` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Indexes: `group_id + status + created_at`, `author_user_id + created_at`.

## `community_group_messages`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| group_id | varchar/string | yes | 128 |
| author_user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 2000 |
| created_at | varchar/string | yes | ISO timestamp |

Indexes: `group_id + created_at`, `author_user_id + created_at`.

## Privacy behavior and limitations

- `public`: visible to verified adult members; discussion is readable without joining, but only active members can post.
- `members`: discoverable to verified adult members; discussion requires active membership.
- `private`: hidden from the directory unless already an active member. Owners can invite discoverable members; invitees can accept or decline from their invitation inbox.
- `approval`: join requests are recorded as `pending`; owners can approve or decline them. Approval rechecks verified-adult eligibility and bidirectional block state. Pending requests do not grant access.
- Invitations are stored as membership rows with status `invited`; acceptance rechecks the invitee's eligibility and block state with the group owner.
- Owners are automatically enrolled and cannot leave through the current UI.
- Text-only discussion posts and group chat. Owners can remove members and transfer ownership. Blocked authors' group discussion posts and group-chat messages are hidden from the viewer. Reporting/moderation workflows, group deletion, and invitation links are not implemented yet.
- All endpoints require signed-in accounts and server-side verified-adult/active-member eligibility. Writes enforce same-origin requests and basic posting limits.
