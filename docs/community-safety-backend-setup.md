# ConnectTime Community Safety Backend Setup

The Safety Center UI is available at `/safety`. The server endpoints require an authenticated Appwrite session and use the existing Appwrite database. Safety requests fail closed: if a table is not configured or storage fails, the API returns an error and does not report success.

## Required environment variables

Set these in the production hosting environment (and staging separately):

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` — server-only key with the minimum TablesDB row read/create/update/delete permissions needed for these tables.
- `APPWRITE_DATABASE_ID` — existing ConnectTime database ID.
- `APPWRITE_COMMUNITY_REPORTS_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`
- `APPWRITE_COMMUNITY_APPEALS_TABLE_ID`

Do not expose `APPWRITE_API_KEY` as a `NEXT_PUBLIC_` variable. Do not reuse an advertising review token as an Appwrite API key.

## Tables to create in the existing Appwrite database

Create these three tables in the existing database (do not create a second database). Use the exact column IDs below. All columns are Text unless otherwise noted. Set required columns as required and optional columns as not required.

### Community reports table

Set `APPWRITE_COMMUNITY_REPORTS_TABLE_ID` to this table ID.

| Column ID | Type | Size | Required |
|---|---|---:|---|
| reporter_user_id | Text | 128 | Yes |
| reported_user_id | Text | 128 | No |
| target_type | Text | 20 | Yes |
| content_reference | Text | 180 | No |
| category | Text | 40 | Yes |
| details | Text | 3000 | Yes |
| status | Text | 30 | Yes |
| created_at | Text | 40 | Yes |

### Community blocks table

Set `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID` to this table ID.

| Column ID | Type | Size | Required |
|---|---|---:|---|
| blocker_user_id | Text | 128 | Yes |
| blocked_user_id | Text | 128 | Yes |
| created_at | Text | 40 | Yes |

### Community appeals table

Set `APPWRITE_COMMUNITY_APPEALS_TABLE_ID` to this table ID.

| Column ID | Type | Size | Required |
|---|---|---:|---|
| appellant_user_id | Text | 128 | Yes |
| enforcement_reference | Text | 180 | Yes |
| reason | Text | 40 | Yes |
| details | Text | 3000 | Yes |
| status | Text | 30 | Yes |
| created_at | Text | 40 | Yes |

The API creates row IDs. The Appwrite server API key performs the table operations, while the user ID is always taken from the authenticated session, never from submitted form data.

## Important launch requirements still outstanding

- Configure all three table IDs and create the columns above before enabling these endpoints in production.
- Add moderator-only review queues, role-based authorization, case assignment, evidence retention rules, and auditable decisions.
- Enforce block relationships across discovery, feeds, comments, and direct messages; the current block endpoint stores and lists a member's block choices but does not yet filter other product surfaces.
- Add rate limiting, abuse-resistant duplicate handling, user notifications, and appeal status tracking.
- Test with separate member accounts, unauthenticated requests, cross-user attempts, unavailable Appwrite storage, and malicious input.
- Establish a documented response process for imminent threats and legally required escalations.

A submitted report is not proof of a violation. Review reports in context and distinguish protected disagreement, criticism, and unpopular opinions from targeted harassment or intimidation.
