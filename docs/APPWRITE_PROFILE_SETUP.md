# Connect profile storage setup

The profile editor at `/profile` stores member profile records in the **existing Appwrite database** used by the Connect server. Do not create a second database.

## 1. Render environment

In the Render web service environment, set:

- `APPWRITE_DATABASE_ID`: the existing Connect database ID.
- `APPWRITE_PROFILES_TABLE_ID`: the ID of the profile table created below.
- `APPWRITE_API_KEY`: a server-only Appwrite API key with permission to read and write rows and inspect the required database/table.

The Appwrite endpoint and project must match the same project used for authentication:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`

Never expose `APPWRITE_API_KEY` in a `NEXT_PUBLIC_*` variable or browser code. After changing Render variables, redeploy the service.

## 2. Create the profiles table

In the existing Appwrite database, create a table with ID `profiles` (or choose another stable ID and put that exact ID in `APPWRITE_PROFILES_TABLE_ID`).

Keep the table private. Do not grant public or client-side read/write access; profile APIs use the server-side Appwrite API key and enforce ownership using the authenticated member ID.

Create these columns (IDs are case-sensitive):

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| `user_id` | varchar | yes | 128 |
| `handle` | varchar | yes | 24 |
| `display_name` | varchar | yes | 80 |
| `bio` | varchar | yes | 500 |
| `country` | varchar | yes | 80 |
| `region` | varchar | yes | 100; empty string is allowed |
| `interests` | varchar | yes | 384; comma-separated |
| `age` | integer | no | only supplied when entered |
| `gender` | varchar | no | 32 |
| `interested_in` | varchar | yes | 32 |
| `relationship_goal` | varchar | yes | 32 |
| `visibility` | varchar | yes | 16 |
| `created_at` | varchar | yes | 40; ISO timestamp |
| `updated_at` | varchar | yes | 40; ISO timestamp |

Add unique indexes on `user_id` and `handle`. The API uses the authenticated Appwrite user ID as the row ID, so each member has one profile row. The unique handle index prevents two accounts from claiming the same username.

## 3. Verify the setup

1. Confirm all environment variables point to the same Appwrite project and existing database.
2. Confirm the table ID exactly matches `APPWRITE_PROFILES_TABLE_ID`.
3. Confirm the table has every required column and both unique indexes.
4. Confirm the server API key has database/table row read and write scopes.
5. Deploy the Render service.
6. Sign in, open `/profile`, save a profile, reload the page, and confirm the saved values remain.
7. Try a second account with the same handle; it should receive a username-in-use message.

A missing profile row is normal for a new member and is created on the first successful save. A missing database or table is a configuration error and must not be treated as an empty profile.

## Privacy and media

Profile rows are private and can only be read or changed by their owner through the server API. Profile photo uploads remain disabled until the separate media quarantine and moderation pipeline is tested and enabled.
