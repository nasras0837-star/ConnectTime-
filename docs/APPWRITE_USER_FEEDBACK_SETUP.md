# Connect user feedback — Appwrite setup

Create a private `user_feedback` table in the existing Connect Appwrite database. Do not create a second database.

- Set server environment variable `APPWRITE_USER_FEEDBACK_TABLE_ID` to the actual table ID.
- Keep the table private; do not grant client-side read/write permissions.
- Only the Next.js server API should write feedback using the server-only Appwrite API key.
- Feedback is associated with the authenticated Appwrite user ID and is not public.

Required columns:

| Column ID | Type | Required | Size / notes |
|---|---|---:|---|
| user_id | varchar/string | yes | 128; authenticated Appwrite user ID |
| rating | integer | yes | 1 through 5 |
| category | varchar/string | yes | 30 |
| feedback | varchar/string | yes | 2000 |
| idea | varchar/string | no | 2000 |
| status | varchar/string | yes | 20; initial value `new` |
| created_at | varchar/string | yes | ISO timestamp |

Recommended indexes:
- `user_id + created_at` for per-member rate limiting and review.
- `status + created_at` for a future internal feedback review queue.
- `rating` for aggregate rating analysis.

## User experience

- Visit `/feedback` from the homepage or account page.
- Members select a 1–5 rating, choose a feedback topic, describe their experience, and optionally suggest an improvement or new feature.
- Submission requires a signed-in account, a valid same-origin request, and a rating from 1 to 5.
- Limit: three submissions per member per rolling hour (application-level limit, not a distributed rate limiter).
- Feedback is private and is not shown in the public community feed.
- A successful submission is confirmed only after Appwrite accepts the row. Missing configuration or storage failure returns an error and does not claim the feedback was saved.

## Review and privacy

A moderator/admin feedback dashboard is not implemented by this change. Review submissions only through authorized Appwrite Console access until a role-protected internal review interface is built. Do not expose the table publicly or display raw member feedback to other users. Define retention and deletion procedures before production launch.
