# ConnectTime Appwrite platform data model

This is the proposed server-side data model for the first production backend. It is a deployment specification, not a claim that these tables/collections have already been created. Create resources in a dedicated Appwrite project and keep all private collections inaccessible to anonymous clients.

## Environment

Use the Appwrite endpoint and project ID as public configuration. Keep the Appwrite API key server-only. The existing `.env.example` currently contains the auth/member-access foundation; add the following server-side IDs after creating the matching resources:

- `APPWRITE_PLATFORM_DATABASE_ID`
- `APPWRITE_PROFILES_COLLECTION_ID`
- `APPWRITE_FRIEND_REQUESTS_COLLECTION_ID`
- `APPWRITE_FRIENDSHIPS_COLLECTION_ID`
- `APPWRITE_BLOCKS_COLLECTION_ID`
- `APPWRITE_POSTS_COLLECTION_ID`
- `APPWRITE_COMMENTS_COLLECTION_ID`
- `APPWRITE_REACTIONS_COLLECTION_ID`
- `APPWRITE_GROUPS_COLLECTION_ID`
- `APPWRITE_GROUP_MEMBERS_COLLECTION_ID`
- `APPWRITE_EVENTS_COLLECTION_ID`
- `APPWRITE_EVENT_RSVPS_COLLECTION_ID`
- `APPWRITE_CONVERSATIONS_COLLECTION_ID`
- `APPWRITE_MESSAGES_COLLECTION_ID`
- `APPWRITE_REPORTS_COLLECTION_ID`
- `APPWRITE_MODERATION_CASES_COLLECTION_ID`
- `APPWRITE_VERIFICATION_RECORDS_COLLECTION_ID`

Do not paste API keys or webhook secrets into chat, source files, screenshots, or public environment variables.

## Common rules

- Use Appwrite user ID as the owner/reference key; never accept an owner ID from an untrusted client when the server can derive it from the session.
- Add indexes for every query path used by the application (owner, status, createdAt, countryCode, relationship IDs, and pagination keys).
- Use server-side permissions for every write. Public profile fields may be readable only when the profile visibility rules permit it.
- Store timestamps in UTC ISO-8601 format.
- Validate and bound all user-supplied strings, arrays, URLs, and pagination values.
- Keep verification evidence, moderation notes, private messages, and reports private.
- Do not store raw government ID images or card details in ConnectTime.

## Proposed collections

### profiles
- `userId` string, required, unique
- `handle` string, required, unique
- `displayName` string, required
- `bio` string, optional
- `countryCode` string, required, ISO 3166-1 alpha-2
- `region` string, optional
- `interests` string array, optional
- `avatarFileId` string, optional
- `visibility` enum: public, members, friends, private
- `accountState` enum: pending, active, restricted, suspended, deleted
- `createdAt`, `updatedAt` datetime

### verification_records
- `userId` string, required, unique per active verification
- `provider` string, required
- `providerReference` string, required
- `status` enum: pending, verified, failed, expired, review
- `verifiedAt` datetime, optional
- `expiresAt` datetime, optional
- `reviewReasonCode` string, optional
- Store no raw ID image or full provider document payload.

### friend_requests
- `senderId`, `recipientId` strings, required
- `status` enum: pending, accepted, declined, cancelled
- `createdAt`, `updatedAt` datetime
- Unique/indexed sender-recipient pair; prevent self-requests.

### friendships
- `userAId`, `userBId` strings, required
- `createdAt` datetime
- Store normalized user ordering to prevent duplicate friendship rows.

### blocks
- `blockerId`, `blockedId` strings, required
- `createdAt` datetime
- Enforce block checks in every search, feed, messaging, and matching query.

### posts
- `authorId` string, required
- `body` string, optional
- `mediaFileIds` string array, optional
- `visibility` enum: public, members, friends, private
- `moderationStatus` enum: pending, approved, rejected, removed
- `createdAt`, `updatedAt` datetime

### comments
- `postId`, `authorId`, `body` required
- `moderationStatus` enum: pending, approved, rejected, removed
- `createdAt` datetime

### reactions
- `targetType` enum: post, comment
- `targetId`, `userId` strings, required
- `reactionType` string, required
- Unique target/user/reaction key.

### groups
- `ownerId`, `name`, `description` required
- `visibility` enum: public, private
- `status` enum: active, restricted, archived
- `createdAt`, `updatedAt` datetime

### group_members
- `groupId`, `userId` strings, required
- `role` enum: owner, moderator, member
- `status` enum: pending, active, removed, banned
- Unique group/user pair.

### events
- `organizerId`, `title`, `description`, `startsAt`, `timeZone`, `countryCode` required
- `region`, `venueLabel`, `onlineUrl` optional
- `visibility` enum: public, members, group
- `status` enum: draft, published, cancelled, removed

### event_rsvps
- `eventId`, `userId` strings, required
- `status` enum: going, interested, notGoing
- Unique event/user pair.

### conversations
- `participantIds` string array, required
- `conversationType` enum: direct, group
- `createdAt`, `updatedAt` datetime
- Validate participants and block/eligibility rules server-side.

### messages
- `conversationId`, `senderId`, `body` required
- `attachmentFileIds` string array, optional
- `moderationStatus` enum: pending, approved, rejected, removed
- `createdAt` datetime
- Only conversation participants and authorized staff may read.

### reports
- `reporterId`, `targetType`, `targetId`, `reasonCode` required
- `details` string, optional
- `status` enum: open, reviewing, actioned, dismissed
- `createdAt`, `resolvedAt` datetime
- Private to reporter (own report status only) and authorized staff.

### moderation_cases
- `targetType`, `targetId`, `status`, `priority` required
- `reasonCodes` string array
- `assignedStaffId`, `resolutionCode`, `createdAt`, `updatedAt`
- Staff-only permissions and immutable audit events for consequential actions.

## Storage buckets

Create separate private buckets for profile images, post media, group/event media, and creator/video uploads. Enforce file type and size limits, signed access, quarantine-before-publication, server-side moderation, and cleanup of rejected/pending files. Do not make a bucket public merely to make image URLs convenient.

## Build order

Create profiles and verification_records first, then friend_requests/friendships/blocks, then posts/comments/reactions, then groups/events, then conversations/messages, then reports/moderation_cases. Add indexes and permissions before exposing any corresponding UI.
