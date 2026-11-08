# Appwrite Events Table Setup

Create a **private** table named `events` in the existing Connect Appwrite database. Do not create a second database or enable public client access. Set `APPWRITE_EVENTS_TABLE_ID` in Netlify (server-side only).

Required columns (types):
- `title` string 90, required
- `category` string 50, required
- `date` string 10, required (YYYY-MM-DD)
- `time` string 5, required (HH:mm)
- `city` string 70, required
- `country` string 70, required
- `venue` string 120, required
- `description` string 600, required
- `price` string 30, required
- `host` string 70, required
- `host_user_id` string 128, required
- `emoji` string 10, required
- `status` string 20, required
- `created_at` string 40, required
- `updated_at` string 40, required

Indexes:
- `host_user_id + created_at` (for rate limits)
- `status + date` (for published event discovery)
- `category + date` (for category filters)

## API behavior

- `GET /api/events`: signed-in, independently verified active adult members only; returns published upcoming events.
- `POST /api/events`: same-origin, verified active member only; validates fields/date/category; maximum 3 submissions per member per 24 hours; creates `pending_review` events (not public).
- Pending submissions are visible in the restricted staff review page at `/advertising-review`, protected by the server-side `AD_REVIEW_ADMIN_TOKEN`.
- Staff can approve an event for publication or reject it. Only approved events with `status=published` appear in the member directory.
- The review queue reads pending events from this same private table; it does not require a second database or a public table permission.

This API is a staging foundation, not a complete event product. Attendee RSVP, organizer management, cancellation/editing, location safety, moderation queue, notification delivery, ticket checkout, and calendar integrations remain future work.
