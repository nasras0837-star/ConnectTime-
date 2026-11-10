# Connect profile table setup

Create this table in the **existing Appwrite database** used by ConnectTime. Do not create a second database.

- Table ID: `profiles` (or another stable ID).
- Set `APPWRITE_PROFILES_TABLE_ID` to the exact table ID used in Appwrite.
- Keep the table private. Do not grant public or client-side create, read, update, or delete access. The Next.js server uses the server-only Appwrite API key and checks profile ownership.
- Column IDs are case-sensitive. The profile API sends every field listed below; omitting an attribute causes Appwrite to reject profile saves (for example, `Unknown attribute: "age"`).

## Required columns

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| `user_id` | varchar/string | yes | 128 |
| `handle` | varchar/string | yes | 24 |
| `display_name` | varchar/string | yes | 80 |
| `bio` | varchar/string | yes | 500 |
| `country` | varchar/string | yes | 80 |
| `region` | varchar/string | yes | 100; empty string is allowed |
| `interests` | varchar/string | yes | 384; comma-separated |
| `age` | integer | no | Optional; supplied only when entered |
| `gender` | varchar/string | no | 32 |
| `interested_in` | varchar/string | yes | 32 |
| `relationship_goal` | varchar/string | yes | 32 |
| `visibility` | varchar/string | yes | 16; public, members, friends, or private |
| `created_at` | varchar/string | yes | 40; ISO timestamp |
| `updated_at` | varchar/string | yes | 40; ISO timestamp |

## Indexes

Create unique indexes on both `user_id` and `handle`. The profile row ID is also the authenticated Appwrite user ID, so each member has one profile row. The unique handle index prevents two accounts from claiming the same username.

## Render environment and permissions

- `APPWRITE_DATABASE_ID`: existing ConnectTime database ID.
- `APPWRITE_PROFILES_TABLE_ID`: exact ID of this table.
- `APPWRITE_API_KEY`: server-only API key with permission to inspect the database/table and read and write table rows.
- `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: same Appwrite project used for authentication.

Never expose `APPWRITE_API_KEY` in a `NEXT_PUBLIC_*` variable or browser code. After changing Render environment variables, redeploy the service.

## Verify the setup

1. Confirm all environment variables point to the same Appwrite project and existing database.
2. Confirm the table ID exactly matches `APPWRITE_PROFILES_TABLE_ID`.
3. Confirm every column above exists with the exact ID, type, required setting, and size.
4. Confirm the unique indexes on `user_id` and `handle` exist.
5. Confirm the server API key has the required database/table and row read/write permissions.
6. Sign in, open `/profile`, save a profile, reload the page, and confirm the saved values remain.
7. Try a second account with the same handle; it should receive a username-in-use message.

A missing profile row is normal for a new member and is created on the first successful save. A missing database, table, or required column is a configuration error and must not be treated as an empty profile.

## Privacy and media

Profile rows are private and can only be read or changed by their owner through the server API. Profile photo uploads remain disabled until the separate media quarantine and moderation pipeline is tested and enabled.
