# Connect full-platform build plan

## Product direction

Connect is an international, web-first social community. It is separate from Pleasure and Flirt. The first release is web-only; native mobile apps are not part of this phase.

## Existing repository foundation

The repository already contains a Next.js 16 App Router application, a visual homepage/feed, signup and login screens, Appwrite SSR session scaffolding, member-access checks, Chat Rooms, Events, News/RSS, Video Tube, an AI assistant endpoint, and advertising moderation/report/review screens. These are prototypes or partial integrations until their backend, permissions, and end-to-end tests are complete.

GitHub Pages publishes only `docs/` as a static preview. The full application must run on a Next.js-compatible host such as the existing Netlify project.

## Product modules and acceptance criteria

### 1. Identity, registration, and profiles
- Email/password registration, login, logout, password recovery, email verification, and session revocation.
- Registration requires country of residence and date of birth; store country/region separately from precise location.
- Public profiles include display name, handle, biography, interests, country, profile photo, privacy settings, and account status.
- Users can edit profile details, block/report members, export account data, and request account deletion.
- Do not expose government ID images or verification vendor payloads in public profile data.

### 2. Adult eligibility and trust
- Adults-only dating and any adult-oriented areas require an external age/identity provider and server-verified result. A checkbox or self-entered birth date is not proof of age.
- Do not permit discovery, direct messaging, dating, or access to restricted areas until the account has the required verified status.
- Store only provider reference, verification state, timestamps, and minimal audit metadata; avoid storing raw ID documents.
- Add rate limits, suspicious-activity controls, reporting, blocking, moderation queues, appeals, and staff audit logs.
- Never describe AI image moderation as a reliable child-sexual-abuse detector. Suspected child sexual abuse material must not be sent to a general moderation API; use a specialist legal/compliance response process.

### 3. Social graph and feed
- Friend requests, accept/decline/cancel, friends list, follows, blocks, and privacy controls.
- Posts with text, approved photos/videos, comments, reactions, shares, saves, and report actions.
- Feed ranking and pagination must be server-side and respect block, privacy, and moderation rules.
- Uploads remain disabled until storage authorization, content screening, takedown, and cleanup tests pass.

### 4. Messaging and calls
- One-to-one and group text messaging, delivery/read state, attachments after moderation, conversation controls, blocking, and reporting.
- Audio/video calling is a later integration using a dedicated real-time provider; do not simulate live calling with static UI.
- No call may bypass member eligibility or block controls.

### 5. Communities
- Groups, public/private membership, group roles, posts, discussion forums, chat rooms, moderation tools, and member reporting.
- Events support creation, RSVP, region/country discovery, time zones, and organizer moderation.

### 6. Discovery and dating
- Search members by approved profile fields, interests, age range, and country/region; never expose exact location.
- Dating is 18+ only and requires server-verified adult eligibility.
- Matching preferences, likes, mutual matches, and messaging are enforced server-side with privacy controls.

### 7. Marketplace and creator media
- Marketplace listings, seller profiles, product media, search, saved items, order records, dispute/refund workflows, and fraud controls.
- Connect Video Tube supports creator channels, video metadata, moderation status, playlists, views, and reporting.
- Uploads and publishing stay disabled until moderation and storage lifecycle are validated.
- Payment provider and seller payout model must be selected before payment code is enabled. Never store card data.

### 8. News and regional discovery
- Publisher RSS/API ingestion with source attribution, deduplication, refresh, and error handling.
- Registration country and optional user-selected region drive regional news; do not silently infer or publish precise location.
- News cards link to the original publisher and respect publisher terms.

### 9. Advertising
- Advertisers select country/region targeting and pay the planned USD 49.99 per ad per month only after a payment provider and billing workflow are approved.
- Ad creative is screened for nudity, sexual content, hate, harassment, violence, scams, and other prohibited content before any charge or publication.
- Require advertiser rights attestation and human review; AI moderation does not prove copyright ownership or claim accuracy.
- Keep ads unpublished and payment disabled unless moderation, human approval, billing, targeting, reporting, and takedown flows are all operational.

### 10. Administration and operations
- Staff roles with least privilege, MFA, audit trail, moderation queue, appeals, takedown intake, account actions, and operational dashboards.
- Add privacy policy, terms, community standards, cookie disclosures where applicable, data retention, and incident response procedures.
- Add automated unit, integration, security, accessibility, and end-to-end tests.

## Delivery sequence

1. **Foundation:** Appwrite project configuration, server-only access helpers, database schema, auth/session tests, country-aware profile model, environment validation, CI.
2. **Member safety:** age-verification provider integration, server-side eligibility state, profile privacy, report/block, admin audit trail.
3. **Social core:** profiles, friend graph, posts, comments, reactions, feed, and safe media pipeline.
4. **Community:** groups, forums, chat rooms, events, and moderation.
5. **Messaging and calls:** real-time text messaging first; audio/video calling only after provider selection.
6. **Discovery and dating:** adult-only discovery, preferences, matches, and safety controls.
7. **Marketplace and Video Tube:** creator profiles, listings, video metadata, storage pipeline, payment provider decision, and transaction safeguards.
8. **News and advertising:** regional feeds, campaign lifecycle, moderation, human review, billing, and reporting.
9. **Launch readiness:** load/security/accessibility testing, legal review, monitoring, backups, recovery, and staged rollout.

## Release rule

A screen or route is not considered a working feature merely because it renders. A feature is complete only when its authenticated server actions, data model, authorization, abuse controls, tests, and deployment configuration work together. Demo content must be clearly labelled and must not be presented as live user activity.
