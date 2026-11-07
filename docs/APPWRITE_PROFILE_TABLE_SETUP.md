# ConnectTime profile table setup

Create this table in the existing Appwrite database (do not create a second database).

- Table ID: choose a stable ID such as `profiles`
- Set `APPWRITE_PROFILES_TABLE_ID` to the actual table ID in the deployment environment.
- Keep the table private. Do not grant public create/update/delete access. The Next.js server uses the server-only Appwrite API key.

Required columns:
| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| user_id | varchar/string | yes | 128 |
| handle | varchar/string | yes | 24; unique index recommended |
| display_name | varchar/string | yes | 80 |
| bio | varchar/string | yes | 500 |
| country | varchar/string | yes | 80 |
| region | varchar/string | yes | 100 |
| interests | varchar/string | yes | 384; comma-separated |
| visibility | varchar/string | yes | public, members, friends, private |
| created_at | varchar/string | yes | ISO timestamp |
| updated_at | varchar/string | yes | ISO timestamp |

Use the Appwrite row ID as the authenticated Appwrite user ID. Add a unique index on `handle` and an index on `user_id`. This first profile endpoint only lets a signed-in user read or update their own row; public profile discovery is intentionally not enabled until visibility, block filtering, and adult eligibility are enforced server-side.
