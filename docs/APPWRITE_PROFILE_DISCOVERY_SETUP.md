# Connect profile discovery setup

This feature uses the existing Appwrite database and the existing profile, block, and member-access tables. It does not create a new database.

## Required environment variables

- `APPWRITE_PROFILES_TABLE_ID` — profile table in `APPWRITE_DATABASE_ID`.
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID` — block table in `APPWRITE_DATABASE_ID`.
- `APPWRITE_ACCESS_DATABASE_ID` — database containing independent member-access records.
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID` — collection containing member-access records keyed by Appwrite user ID.
- Existing server-only `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `NEXT_PUBLIC_APPWRITE_ENDPOINT`, and `NEXT_PUBLIC_APPWRITE_PROJECT_ID`.

## Privacy and eligibility behavior

- Discovery requires a signed-in viewer whose own access record says `adult_status=verified` and `account_status=active`.
- Only profiles with visibility `public` or `members` are considered. Friends-only and private profiles are not listed.
- Each candidate is independently checked against the member-access record. Missing, unreadable, pending, rejected, suspended, or banned records are excluded.
- Blocks are applied in both directions: profiles blocked by the viewer and profiles whose owner blocked the viewer are hidden.
- The API returns only handle, display name, bio, country, region, and interests. It never returns Appwrite user IDs, verification details, or account status.
- Search and filters operate on the bounded candidate set (up to 100 newest profiles). Pagination and rate limiting should be added before large-scale rollout.

## Setup

Create the profile table using `APPWRITE_PROFILE_TABLE_SETUP.md` and ensure the block table and member-access collection are configured. Keep tables private; all access is performed server-side. Until configuration is complete, the endpoint returns an unavailable response and does not expose profiles.
