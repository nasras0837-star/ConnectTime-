# Connect Community Safety Backend Setup

The Safety Center UI is available at `/safety`. Member report submission uses the existing Appwrite database. Reports are allegations and must be reviewed in context.

## Required environment variables

Set these in Render (and separately in staging):

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` — server-only key with the minimum TablesDB row read/create/update/delete and member-access document permissions needed.
- `APPWRITE_DATABASE_ID` — existing Connect database ID.
- `APPWRITE_COMMUNITY_REPORTS_TABLE_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`
- `APPWRITE_COMMUNITY_APPEALS_TABLE_ID`\n- `APPWRITE_MODERATION_AUDIT_TABLE_ID`
- `APPWRITE_MODERATOR_USER_IDS` — comma-separated Appwrite user IDs of trusted moderators. Server-only; never use a browser-submitted role to grant access.
- `APPWRITE_ACCESS_DATABASE_ID` and `APPWRITE_MEMBER_ACCESS_COLLECTION_ID` — required for moderator account suspension.
- `APPWRITE_COMMUNITY_POSTS_TABLE_ID` and/or `APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID` — required for moderator post removal.

Do not expose `APPWRITE_API_KEY` or `APPWRITE_MODERATOR_USER_IDS` as public environment variables.

## Tables to create in the existing Appwrite database

All tables must remain private. Use exact column IDs below. All columns are Text unless otherwise noted.

### Community reports table

Set `APPWRITE_COMMUNITY_REPORTS_TABLE_ID` to this table ID.

| Column ID | Type | Size | Required |
|---|---|---:|---:|
| reporter_user_id | Text | 128 | Yes |
| reported_user_id | Text | 128 | No |
| target_type | Text | 20 | Yes |
| content_reference | Text | 180 | No |
| category | Text | 40 | Yes |
| details | Text | 3000 | Yes |
| status | Text | 30 | Yes |
| created_at | Text | 40 | Yes |
| reviewer_user_id | Text | 128 | No |
| reviewed_at | Text | 40 | No |
| resolution_note | Text | 1000 | No |
| action_taken | Text | 30 | No |

Create indexes on `status + created_at` and `created_at` for moderator queue ordering.

### Community blocks table

Set `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`.

| Column ID | Type | Size | Required |
|---|---|---:|---:|
| blocker_user_id | Text | 128 | Yes |
| blocked_user_id | Text | 128 | Yes |
| created_at | Text | 40 | Yes |

Indexes: key index on `blocker_user_id`; composite key index on `blocker_user_id` and `blocked_user_id`.

### Community appeals table

Set `APPWRITE_COMMUNITY_APPEALS_TABLE_ID`.

| Column ID | Type | Size | Required |
|---|---|---:|---:|
| appellant_user_id | Text | 128 | Yes |
| enforcement_reference | Text | 180 | Yes |
| reason | Text | 40 | Yes |
| details | Text | 3000 | Yes |
| status | Text | 30 | Yes |
| created_at | Text | 40 | Yes |

Create indexes on `status + created_at` for appeals review.\n\n### Moderation audit table\n\nSet `APPWRITE_MODERATION_AUDIT_TABLE_ID` to a private table with these Text columns:\n\n| Column ID | Size | Required |\n|---|---:|---|\n| moderator_user_id | 128 | Yes |\n| event_type | 40 | Yes |\n| target_user_id | 128 | No |\n| report_id | 128 | No |\n| action | 40 | Yes |\n| outcome | 40 | No |\n| note | 1000 | No |\n| created_at | 40 | Yes |\n\nKeep this table private and restrict access to server-side moderator operations. The `/moderation/audit` page is read-only and moderator allowlist protected. Audit writes are best-effort: configure and test the table before relying on it for compliance records.

## Moderator API

- `GET /api/community/moderation` lists up to 100 reports. Optional `?status=open`, `reviewing`, `resolved`, or `dismissed` filters the queue.
- `PATCH /api/community/moderation` accepts `reportId`, `status`, `action`, and `resolutionNote`. Status: `reviewing`, `resolved`, or `dismissed`. Actions: `none`, `remove_content`, or `suspend_member`.
- Requests require an authenticated Appwrite session and a user ID in the server-side `APPWRITE_MODERATOR_USER_IDS` allowlist. Writes also require same-origin requests.
- Post removal is limited to community feed and group posts and changes the post status to `removed`; it does not permanently delete records. Message removal is not supported.
- Account restriction changes the target member-access document's `account_status` to `suspended`. It does not delete the account or disable Appwrite authentication.
- Resolving a report requires a moderator note. Dismissed reports cannot carry an enforcement action. Closed reports cannot be changed through this endpoint.\n- `GET /api/community/moderation/appeals` lists up to 100 appeals; optional status filter: `received`, `reviewing`, `upheld`, `overturned`, or `dismissed`. `PATCH` records `appealId`, status, review note, moderator ID, and timestamp. Final appeal decisions require a review note and cannot be changed.

## Operational safeguards and launch gates

- Review reports as allegations, not proof. Preserve distinctions between threats/harassment and protected disagreement or criticism.
- Limit and regularly review moderator access. Define evidence retention, escalation, and emergency-response procedures.
- The appeal review queue is available at `/moderation/appeals`; appeal outcomes are recorded but do not automatically reinstate accounts, reverse removed content, or notify appellants.
- Test with two separate member accounts and a moderator account: unauthenticated access, ordinary-member denial, queue visibility, invalid IDs, mismatched reported author, post removal, suspension, closed-report conflicts, and Appwrite outages.
- Moderator report, appeal, and read-only audit dashboards are available at `/moderation`, `/moderation/appeals`, and `/moderation/audit`. Decision notifications are written to the configured Connect notifications table; automated appeal reversal remains intentionally manual; overturned appeals now expose a moderator-confirmed restoration action with a separate audit event. Verify other active enforcement before reinstating a member. Audit export remains outstanding.
