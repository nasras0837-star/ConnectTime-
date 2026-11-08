# Connect Free TV watchlist setup

Create this table in the existing Appwrite database. Do not create a second database.

- Table ID: choose a stable ID such as `free_tv_watchlist`.
- Set `APPWRITE_FREE_TV_WATCHLIST_TABLE_ID` in the Netlify environment to the exact table ID.
- Keep the table private. Do not grant public create, read, update, or delete permissions. The Next.js server accesses it with the server-only Appwrite API key.
- Use the same database configured by `APPWRITE_DATABASE_ID`.

Required columns:

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| user_id | varchar/string | yes | 128; Appwrite user ID |
| channel_id | varchar/string | yes | 64; ID from the Free TV channel directory |
| created_at | varchar/string | yes | ISO timestamp |

Add indexes on `user_id` and on the pair `user_id + channel_id` if supported. The API always filters by the authenticated user's ID and checks verified adult/active member access on the server. It does not accept a user ID from the browser. The watchlist will remain unavailable until the table and environment variable are configured.
