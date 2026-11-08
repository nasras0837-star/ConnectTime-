# Connect Podcasts — Appwrite setup

Connect Podcasts lets verified adult members create shows and submit audio episodes. New shows and episodes are saved as `pending_review`; moderators must approve them by changing the row's `status` to `published` before they appear in public discovery.

## Environment variables

Add these server-side variables to the Connect deployment:

- `APPWRITE_PODCASTS_TABLE_ID` — Table ID for podcast shows.
- `APPWRITE_PODCAST_EPISODES_TABLE_ID` — Table ID for podcast episodes.
- `APPWRITE_PODCASTS_BUCKET_ID` — Appwrite Storage bucket ID for audio files.

Existing `APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`, `NEXT_PUBLIC_APPWRITE_ENDPOINT`, and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` are also required. Keep `APPWRITE_API_KEY` server-only.

## Create the tables

Create both tables in the database configured by `APPWRITE_DATABASE_ID`. Use string columns unless noted.

### Podcast shows table

| Column | Type | Notes |
|---|---|---|
| creator_user_id | string | Required; Appwrite user ID |
| creator_name | string | Required |
| title | string | Required; max 90 |
| description | string | Required; max 600 |
| category | string | Required |
| artwork_url | string | Optional HTTPS URL |
| status | string | Required; `pending_review` or `published` |
| created_at | string | ISO timestamp |
| updated_at | string | ISO timestamp |

### Podcast episodes table

| Column | Type | Notes |
|---|---|---|
| show_id | string | Required; show row ID |
| creator_user_id | string | Required; Appwrite user ID |
| title | string | Required; max 90 |
| description | string | Optional; max 600 |
| audio_file_id | string | Required; Appwrite Storage file ID |
| audio_file_name | string | Required |
| audio_mime_type | string | Required |
| status | string | Required; `pending_review` or `published` |
| created_at | string | ISO timestamp |
| updated_at | string | ISO timestamp |

Add indexes for `creator_user_id`, `show_id`, and `status` to support the API queries.

## Create the audio bucket

Create a private Appwrite Storage bucket and set its ID as `APPWRITE_PODCASTS_BUCKET_ID`. Set the maximum file size to at least 40 MB and allow only audio MIME types: MP3/MPEG, MP4/M4A, AAC, OGG, WAV, WebM, and FLAC. The server API key performs uploads and audio delivery; do not grant public bucket access. The audio route checks verified adult membership and only streams published episodes, except that the creator can preview their own pending episode.

## Moderation workflow

1. Review show and episode metadata and audio before publication.
2. Change approved show rows to `published` in the shows table.
3. Change approved episode rows to `published` in the episodes table.
4. Keep rejected submissions unpublished and follow Connect's community guidelines and applicable copyright rules.

The app does not automatically clear copyright, music licensing, or content-safety rights. Creators must only upload audio they own or are authorized to distribute.

## Routes

- `/podcasts` — Discover published podcasts and manage the signed-in creator's shows.
- `GET /api/podcasts` — Published shows and episodes.
- `GET /api/podcasts?mine=1` — Creator's shows, including pending review.
- `POST /api/podcasts` JSON `{ "action": "create_show", ... }` — Submit a show.
- `POST /api/podcasts` multipart form — Upload an episode with `showId`, `title`, `description`, and `audio`.
- `GET /api/podcasts/audio/:episodeId` — Authenticated audio streaming.
