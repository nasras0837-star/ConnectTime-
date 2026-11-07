# ConnectTime advertising review setup

The advertising review and complaint routes require Appwrite server-side credentials and collections. Until configured, these endpoints fail closed and do not accept ads for payment or publication.

## Netlify environment variables

Configure these in the Netlify site's production environment (never expose secret values in NEXT_PUBLIC variables):

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite endpoint URL.
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite project ID.
- `APPWRITE_API_KEY`: server API key with only the required database document read/create/update permissions.
- `APPWRITE_DATABASE_ID`: database ID containing the collections below.
- `APPWRITE_ADS_COLLECTION_ID`: collection ID for ad review submissions.
- `APPWRITE_AD_COMPLAINTS_COLLECTION_ID`: collection ID for complaints and takedown reports.
- `AD_REVIEW_ADMIN_TOKEN`: long random secret used by staff to access the review queue. Rotate it if exposed.
- `OPENAI_API_KEY`: server-side key used by the AI moderation endpoint.

## Appwrite collection: ad submissions

Create a collection and set its ID as `APPWRITE_ADS_COLLECTION_ID`. Add string attributes with the indicated maximum lengths:

- company (160), campaign (160), headline (200), body (2000), imageUrl (2048)
- status (40), createdAt (40)
- flaggedCategories (string array, each value max 100)
- rightsConfirmed (boolean)

Ad status begins as `manual_review_required` or `rejected`. A human staff reviewer may mark it approved, rejected, paused, or takedown. Approval currently records a review decision only; it does not trigger payment or ad delivery.

## Appwrite collection: complaints

Create a collection and set its ID as `APPWRITE_AD_COMPLAINTS_COLLECTION_ID`. Add string attributes:

- type (40), adReference (160), workDescription (2000), details (4000)
- claimantName (160), claimantEmail (254), status (40), createdAt (40)
- claimantAddress (1000), electronicSignature (160)

Also add boolean attribute `goodFaith`.

Set collection permissions so only the server API key can read and write documents. Do not grant public read access. The public complaint endpoint only creates reports; staff queue endpoints require the server-side admin token.

## Staff review

Open `/advertising-review` after setting `AD_REVIEW_ADMIN_TOKEN`. Enter the token to load the queue. Keep it private and use a secure staff device. The current simple token gate is a bootstrap control, not a replacement for staff accounts, MFA, role-based access, audit logs, or session management. Those are required before public commercial launch.

## Copyright / trademark notices

The intake form is an initial reporting workflow, not legal advice and not a guarantee of statutory DMCA compliance. Before launch, have counsel validate the notice and counter-notice procedures for applicable jurisdictions, including required claimant contact details, identification of the protected work and challenged material, good-faith statement, accuracy/authority declaration, electronic signature, prompt handling, repeat-infringer policy, and designated-agent requirements where applicable.

## Safety and child protection

Do not ask users to upload or send suspected child sexual abuse material as part of a complaint. Provide a reporting path that captures the ad reference and textual details only. Escalate credible child-safety reports immediately under the platform's legal and safety procedures. Human review remains mandatory for all ad creatives; the AI moderation pass is preliminary and does not determine copyright ownership, advertiser legitimacy, legal claims, or every image-safety risk.
