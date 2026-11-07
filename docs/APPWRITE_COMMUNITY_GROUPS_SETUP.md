# ConnectTime community text posts — Appwrite setup

Create a `community_posts` table in the existing database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Set the server environment variable `APPWRITE_COMMUNITY_POSTS_TABLE_ID` to the exact table ID.

Keep the table private with no public create/read/update/delete permissions. Only the server-side Appwrite API key should access it.

Required columns:

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| author_user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 1500 |
| status | varchar/string | yes | 20; initial value `published` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Recommended indexes:
- `author_user_id + created_at`
- `created_at`
- `status + created_at`

Required existing configuration:
- `APPWRITE_PROFILES_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`
- `APPWRITE_COMMUNITY_REPORTS_TABLE_ID` for post reports

## Initial feature behavior

- Only signed-in members whose server-side access record confirms verified-adult eligibility and active account status can read or publish.
- Publishing requires a profile whose visibility is Public or Signed-in members.
- Posts are text-only, limited to 1,500 characters, and displayed as text.
- A member is limited to five posts in a rolling ten-minute window (basic application-level throttling, not a distributed rate limiter).
- Feed results exclude members who are not independently eligible, whose profiles are not publicly visible to members, or who are blocked in either direction.
- Members can report a post through the existing private community-report endpoint.
- Photo/video uploads, reposts, editing, deletion, moderation queues, and real-time updates are not part of this first release.
- Comments are text-only (500 characters each), limited to 20 per member per rolling ten minutes. Members can add or remove a single Like reaction per post.
- The feed is not a substitute for a staffed safety response process. Configure reporting, moderation staffing, evidence retention, and incident escalation before opening the platform publicly.

## Configure before testing

Add `APPWRITE_COMMUNITY_POSTS_TABLE_ID` to the Netlify server environment and create the table/columns/indexes above in the existing Appwrite database. Keep the table private. Then deploy the Next.js application to Netlify; GitHub Pages is a static preview and cannot execute these API routes.

## Comments and Like reactions

Create two additional private tables in the same existing Appwrite database and set these server-only environment variables:

- `APPWRITE_COMMUNITY_COMMENTS_TABLE_ID`
- `APPWRITE_COMMUNITY_REACTIONS_TABLE_ID`

**comments** required columns:

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| post_id | varchar/string | yes | 128 |
| user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 500 |
| created_at | varchar/string | yes | ISO timestamp |
| status | varchar/string | yes | 20; `published` |

Recommended comments indexes: `post_id + created_at`, `user_id + created_at`, and `status + created_at`.

**reactions** required columns:

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| post_id | varchar/string | yes | 128 |
| user_id | varchar/string | yes | 128 |
| reaction | varchar/string | yes | 20; currently `like` |
| created_at | varchar/string | yes | ISO timestamp |

Create a unique index on `post_id + user_id` to prevent duplicate likes, plus an index on `post_id`. The API toggles a member's Like on/off. Keep both tables private and grant access only through the server API key.

The interactions API requires the same verified-adult and active-member access record as posting. It checks post visibility and blocks in both directions, filters comments from blocked or ineligible members, and limits comments to 20 per member per rolling ten minutes. Application-level throttling is not a distributed rate limiter. Configure edge/WAF limits before public launch.


## Community groups, membership, and discussion setup

Use the existing Appwrite database referenced by `APPWRITE_DATABASE_ID`. Do not create another database. Create three private TablesDB tables and keep all permissions server-only (no public read/write permissions). Configure these server environment variables:

- `APPWRITE_COMMUNITY_GROUPS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID`
- `APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID`

### `community_groups`

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

### `community_group_members`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| group_id | varchar/string | yes | 128 |
| user_id | varchar/string | yes | 128 |
| role | varchar/string | yes | 20; `owner` or `member` |
| status | varchar/string | yes | 20; `active`, `pending`, or `left` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Indexes: `group_id + user_id` (unique), `user_id + status`, `group_id + status`.

### `community_group_posts`

| Column | Type | Required | Size / notes |
|---|---|---:|---|
| group_id | varchar/string | yes | 128 |
| author_user_id | varchar/string | yes | 128 |
| body | varchar/string | yes | 1500 |
| status | varchar/string | yes | 20; initial `published` |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Indexes: `group_id + status + created_at`, `author_user_id + created_at`.

### Privacy behavior and current limitations

- `public`: visible to verified adult members; discussion is readable without joining, but only active members can post.
- `members`: discoverable to verified adult members; discussion requires active membership.
- `private`: hidden from the directory unless already a member. Invitation management is not implemented yet, so private groups cannot currently be joined through the UI.
- `approval`: join requests are recorded as `pending`. Owner approval tools and notifications are a follow-up task; pending requests do not grant access.
- Owners are automatically enrolled. An owner cannot leave through the current UI.
- Text-only discussion posts; moderation/report controls for group posts, member removal, owner transfer, group deletion, and invitation links are not implemented yet.
- All endpoints require a signed-in account and server-side verified-adult/active-member eligibility. Writes enforce same-origin requests and posting limits.
