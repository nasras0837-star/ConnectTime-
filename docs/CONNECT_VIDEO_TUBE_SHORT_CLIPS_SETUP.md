# Connect Video Tube — Short Clips and smart discovery setup

Connect Short Clips is integrated into the existing /videos Connect Video Tube experience. It uses the existing Appwrite project and database; it does not create a separate database.

## Required environment

Add APPWRITE_VIDEO_TUBE_TABLE_ID to the server environment. The table must be in APPWRITE_DATABASE_ID. Keep APPWRITE_API_KEY server-only. Existing NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_ACCESS_DATABASE_ID, and APPWRITE_MEMBER_ACCESS_COLLECTION_ID are also required.

## Table columns

Create a private Appwrite TablesDB table with these columns:

- record_type — string; values clip or search
- user_id — string
- title — string
- caption — string
- category — string
- creator_name — string
- media_url — URL/string
- thumbnail_url — URL/string
- view_count — integer
- status — string; values include draft, pending_review, approved, rejected
- query_text — string
- event_type — string
- created_at — ISO date-time string
- updated_at — ISO date-time string

Recommended indexes: record_type + status + created_at, record_type + user_id + status, and record_type + user_id + created_at. The table must remain private; only the server API key accesses it.

## Behavior and release gates

- Public/recommended Short Clips are read only where record_type=clip and status=approved.
- Creator Studio saves metadata-only private drafts (status=draft). It does not upload a video file and there is no publishing endpoint.
- The video file input remains disabled. Do not enable Storage uploads or public publishing until the staged moderation/quarantine pipeline has passed its release checks and a separate activation change is approved.
- Search terms are stored per authenticated member and classified into topic signals. Recent search topics rank approved clips; no search history is exposed to other members.
- Watching approved clips and syncing search interests require a signed-in member whose account_status is active; adult_status is not checked for viewing.
- Saving creator drafts still requires adult_status=verified and account_status=active. This is a creator-side gate, not a viewer gate.
- Request writes are same-origin checked and use the authenticated Appwrite user ID, never a client-supplied owner ID.
- Do not put media in a public bucket before approval. Approved media URLs should point only to the final delivery location configured after moderation.

## Manual verification

1. Configure the table and APPWRITE_VIDEO_TUBE_TABLE_ID.
2. Sign in as an active, verified adult member.
3. Search several topics in Connect Video Tube; confirm search history and topic ranking sync after reload.
4. Sign in as an active member without an adult-verification record; confirm approved clips can be watched and search interests sync.
5. Sign in as an active, verified creator and save a Short Clip draft; confirm it is private and its status is draft.
6. Confirm the upload control is disabled and that only approved clip rows appear in the feed.
7. Test signed-out and inactive/suspended/banned accounts; they must be denied. Test an unverified active member; viewing should succeed but draft creation should be denied.
8. Test a cross-origin POST; it must be rejected.

## Creator content policy

Before any upload or publish feature is activated, the moderation workflow must enforce:

- No nudity or sexually explicit content.
- No copyrighted material without ownership, permission, or a valid license. Creators must attest to their rights; complaints and takedown requests must be handled.
- Profanity and strong language are allowed and are not, by themselves, grounds for rejection.
- Only content that passes the applicable safety and rights checks may transition to approved.

Automated scanning alone cannot reliably establish copyright ownership or guarantee that a clip is free of nudity. Keep uploads and publishing disabled until the quarantine pipeline, human review/escalation, and rights-complaint handling are implemented and tested.
