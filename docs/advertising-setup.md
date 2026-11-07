# ConnectTime advertising review setup

The advertising endpoints use Appwrite **TablesDB** (tables and rows). Your existing database is the TablesDB database shown in the Appwrite Console. Until the two tables and server credentials are configured, the endpoints fail closed and do not accept ads for payment or publication.

## Tables to create

In Appwrite Console, open your existing database and create these two tables:

- `advertising_ads` — set its ID as `APPWRITE_ADS_TABLE_ID`.
- `advertising_complaints` — set its ID as `APPWRITE_AD_COMPLAINTS_TABLE_ID`.

Create the following columns on each table. Use the column types shown; make columns optional unless explicitly marked required. Do not enable public table/row permissions. The server API key is used for server-side access.

### `advertising_ads` columns

| Column ID | Type | Size / setting | Required |
|---|---|---:|---|
| advertiser_user_id | Varchar | 64 | No (new submissions populate it) |\n| ad_company | Varchar | 160 | Yes |
| campaign_name | Varchar | 160 | Yes |
| ad_headline | Varchar | 200 | No |
| ad_body | Varchar | 2000 | No |
| image_url | Varchar | 2048 | No |
| rights_confirmed | Boolean | — | Yes |
| status | Varchar | 40 | Yes |
| flagged_categories | Varchar | 1000 | No |
| created_at | Varchar | 40 | Yes |
| reviewed_at | Varchar | 40 | No |

### `advertising_complaints` columns

| Column ID | Type | Size / setting | Required |
|---|---|---:|---|
| type | Varchar | 40 | Yes |
| adReference | Varchar | 160 | Yes |
| workDescription | Varchar | 2000 | No |
| details | Varchar | 4000 | Yes |
| claimantName | Varchar | 160 | Yes |
| claimantEmail | Email | — | Yes |
| claimantAddress | Varchar | 1000 | Yes |
| electronicSignature | Varchar | 160 | Yes |
| status | Varchar | 40 | Yes |
| goodFaith | Boolean | — | Yes |
| createdAt | Varchar | 40 | Yes |
| reviewedAt | Varchar | 40 | No |

## Netlify environment variables

Configure these in the Netlify site's production environment. Never expose secret values in `NEXT_PUBLIC_` variables.

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite API endpoint, including `/v1`.
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite project ID.
- `APPWRITE_API_KEY`: server API key with only the required `rows.read` and `rows.write` scopes.
- `APPWRITE_DATABASE_ID`: your existing TablesDB database ID.
- `APPWRITE_ADS_TABLE_ID`: ID of the `advertising_ads` table.
- `APPWRITE_AD_COMPLAINTS_TABLE_ID`: ID of the `advertising_complaints` table.
- `AD_REVIEW_ADMIN_TOKEN`: long random secret used by staff to access the review queue. Rotate it if exposed.
- `OPENAI_API_KEY`: server-side key used by the AI moderation endpoint.

The Appwrite API key must be created in the same Appwrite project. Do not paste API keys or admin tokens into chat or commit them to GitHub.

## Staff review

Open `/advertising-review` after setting `AD_REVIEW_ADMIN_TOKEN`. Enter the token to load ad submissions, campaign budget/targeting drafts, and complaints. The reviewer must assess the ad creative and advertiser rights, then separately approve/reject/pause the campaign record. Keep it private and use a secure staff device. The current simple token gate is a bootstrap control, not a replacement for staff accounts, MFA, role-based access, audit logs, or session management. Those are required before public commercial launch.

## Copyright / trademark notices

The intake form is an initial reporting workflow, not legal advice and not a guarantee of statutory DMCA compliance. Before launch, have counsel validate the notice and counter-notice procedures for applicable jurisdictions, including required claimant contact details, identification of the protected work and challenged material, good-faith statement, accuracy/authority declaration, electronic signature, prompt handling, repeat-infringer policy, and designated-agent requirements where applicable.

## Safety and child protection

Do not ask users to upload or send suspected child sexual abuse material as part of a complaint. Provide a reporting path that captures the ad reference and textual details only. Escalate credible child-safety reports immediately under the platform's legal and safety procedures. Human review remains mandatory for all ad creatives; the AI moderation pass is preliminary and does not determine copyright ownership, advertiser legitimacy, legal claims, or every image-safety risk.


## Campaign drafts and budget controls

The campaign planner now submits a campaign draft after the creative receives an unflagged preliminary AI result. Creating a draft requires a signed-in account with the platform's server-side verified-member access record. A draft is not approved, paid, scheduled for delivery, or eligible for auction. Campaign listing is available through `GET /api/advertising/campaigns`; draft creation is available through `POST /api/advertising/campaigns`.

Create a third Appwrite TablesDB table:

- `advertising_campaigns` — set its ID as `APPWRITE_AD_CAMPAIGNS_TABLE_ID`.

Create these columns (use the exact IDs; make optional unless required):

| Column ID | Type | Size / setting | Required |
|---|---|---:|---|
| advertiser_user_id | Varchar | 64 | Yes |
| ad_submission_id | Varchar | 64 | Yes |
| company | Varchar | 160 | Yes |
| campaign_name | Varchar | 160 | Yes |
| objective | Varchar | 40 | Yes |
| placement | Varchar | 40 | Yes |
| region | Varchar | 80 | Yes |
| country | Varchar | 100 | Yes |
| geo_targets | Varchar | 2000 | No |
| daily_budget_minor | Integer | — | Yes |
| lifetime_cap_minor | Integer | — | Yes |
| currency | Varchar | 3 | Yes |
| bid_strategy | Varchar | 24 | Yes |
| status | Varchar | 32 | Yes |
| moderation_status | Varchar | 32 | Yes |
| human_review_status | Varchar | 32 | Yes |
| payment_status | Varchar | 32 | Yes |
| starts_at | Varchar | 40 | Yes |
| ends_at | Varchar | 40 | Yes |
| spend_minor | Integer | — | Yes |
| created_at | Varchar | 40 | Yes |

Store monetary values as integer USD cents (for example, $5.00 is 500). Keep advertiser data private; do not grant public read or write access. The API uses server-side Appwrite credentials and filters campaign reads to the signed-in advertiser's user ID.

Add this Netlify environment variable:

- `APPWRITE_AD_CAMPAIGNS_TABLE_ID`: the ID of the `advertising_campaigns` table.

The campaign API also depends on the existing member-access environment variables (`APPWRITE_ACCESS_DATABASE_ID` and `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`) and a valid verified-adult access record for the signed-in advertiser. If these are absent, draft creation fails closed.

**Not implemented yet:** live auction selection, atomic budget reservations, authoritative impression/click measurement, payment authorization/capture, invoicing, refunds, and spend ledger reconciliation. The current campaign API only stores private drafts with advertiser-selected budget limits. Do not enable public paid delivery until those systems and concurrency/accounting tests are complete.
