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
- Photo/video uploads, comments, likes, reposts, editing, deletion, moderation queues, and real-time updates are not part of this first release.
- The feed is not a substitute for a staffed safety response process. Configure reporting, moderation staffing, evidence retention, and incident escalation before opening the platform publicly.

## Configure before testing

Add `APPWRITE_COMMUNITY_POSTS_TABLE_ID` to the Netlify server environment and create the table/columns/indexes above in the existing Appwrite database. Keep the table private. Then deploy the Next.js application to Netlify; GitHub Pages is a static preview and cannot execute these API routes.
