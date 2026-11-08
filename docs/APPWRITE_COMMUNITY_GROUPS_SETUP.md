# Connect community groups — Appwrite setup

Use the existing Appwrite database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Create three private TablesDB tables and keep all permissions server-only (no public read/write permissions). Configure these server environment variables:

- `APPWRITE_COMMUNITY_GROUPS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID`

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
| status | varchar/string | yes | 20; `active`, `pending`, or `left` |
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

## Privacy behavior and limitations

- `public`: visible to verified adult members; discussion is readable without joining, but only active members can post.
- `members`: discoverable to verified adult members; discussion requires active membership.
- `private`: hidden from the directory unless already a member. Invitation management is not implemented, so private groups cannot currently be joined through the UI.
- `approval`: join requests are recorded as `pending`. Owner approval tools and notifications are a follow-up task; pending requests do not grant access.
- Owners are automatically enrolled and cannot leave through the current UI.
- Text-only discussion posts. Reporting/moderation for group posts, member removal, owner transfer, group deletion, and invitation links are not implemented yet.
- All endpoints require signed-in accounts and server-side verified-adult/active-member eligibility. Writes enforce same-origin requests and basic posting limits.
