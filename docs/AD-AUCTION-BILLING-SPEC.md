# Connect Ad Auction and Billing Specification

## Product policy

Connect advertising uses advertiser-controlled budgets and an auction model. There is no fixed monthly price per ad and no guaranteed CPC, CPM, CPL, impression count, click count, or lead volume.

Advertisers configure:
- Campaign objective: awareness, traffic, engagement, leads, sales, event attendance, or app promotion.
- Eligible geography and audience constraints.
- Placement and creative format.
- Start/end dates.
- Daily budget (minimum initial setting: US$1).
- Lifetime campaign cap (must be at least the daily budget).
- Bidding strategy: lowest cost, cost goal, or maximum bid cap, once those strategies are supported by the auction engine.

## Auction design

1. A placement request identifies eligible campaigns using geography, placement, schedule, audience rules, policy status, payment status, and remaining budget.
2. Reject campaigns that are paused, expired, unapproved, unpaid, out of budget, or missing required verification.
3. Apply frequency caps and advertiser exclusions before ranking.
4. Calculate a ranking score from the advertiser's bid, predicted action probability, and a quality/relevance factor. Keep ranking inputs auditable and protect against discriminatory targeting.
5. Run a second-price-style clearing calculation or another documented auction model. The exact model and any reserve prices must be published to advertisers before launch; never silently change bid semantics.
6. Record an immutable auction impression decision with campaign ID, placement, timestamp, bid inputs, clearing price, and model version.
7. Count only valid, viewable impressions or verified clicks under a published measurement standard. Filter bots, duplicate events, and invalid traffic before billing.
8. Enforce budget reservations atomically so concurrent placements cannot overspend a campaign.
9. Stop delivery when either the daily spend limit or lifetime cap is reached. The first release should not overdeliver above either cap.
10. Reconcile delivery events against the ledger and payment provider. Never treat client-side counters as authoritative billing evidence.

## Budget and billing rules

- Store money as integer minor units (US cents), never floating-point currency values.
- Store currency explicitly; launch initially in USD unless a later approved multi-currency policy is implemented.
- Daily budget is a spend-control setting, not a flat daily charge.
- Lifetime cap is a hard maximum amount chargeable over the campaign.
- Advertiser may lower or raise a budget only through an authenticated, auditable action. A budget increase takes effect prospectively and must be confirmed before it can be spent.
- No spending beyond available payment authorization or prepaid balance.
- No automatic 75% daily overdelivery in the initial release.
- Provide itemized delivery and billing records, remaining budget, and dispute handling.
- Refund or credit invalid traffic and confirmed billing errors under a documented policy.

## Required data model (proposal; not yet created)

### campaigns
- id, advertiser_user_id, business_name, campaign_name
- objective, placement, region, country, geo_targets
- status, moderation_status, human_review_status, payment_status
- daily_budget_minor, lifetime_cap_minor, currency
- bid_strategy, bid_cap_minor, cost_goal_minor
- starts_at, ends_at, created_at, updated_at

### auction_events
- id, campaign_id, placement_id, occurred_at, model_version
- bid_minor, predicted_action_probability, quality_score
- clearing_price_minor, won, eligibility_reason

### delivery_events
- id, campaign_id, auction_event_id, event_type
- occurred_at, deduplication_key, validity_status
- billable_amount_minor, measurement_version

### campaign_budget_ledger
- id, campaign_id, entry_type, amount_minor, currency
- delivery_event_id, payment_reference, created_at
- Entries are append-only; corrections use reversing entries, not destructive edits.

### campaign_daily_spend
- campaign_id, spend_date, reserved_minor, settled_minor
- Must be updated transactionally with the ledger and delivery reservation.

## Security, integrity, and safety gates

- Advertiser identity/business checks and authenticated ownership are required.
- AI content screening is preliminary; human review is required for rights, trademark, claims, and policy concerns.
- Ads flagged or not reviewed remain ineligible for auctions.
- No payment authorization or charge before required approval.
- Do not send suspected child sexual abuse material to general-purpose moderation services.
- Server-side auction and ledger are authoritative. Never accept bid, price, impression, click, or spend values from the browser as billing truth.
- Protect against replay, event spoofing, duplicate events, concurrent overspend, currency confusion, and unauthorized campaign edits.
- Keep staff actions and campaign status changes in an audit log.

## Rollout gates

The existing campaign page is a planning UI only. This specification does not mean auction serving, campaign persistence, payment collection, reporting, or live ad delivery already exist.

Before enabling paid ads, implement and test:
1. Authenticated advertiser and campaign CRUD APIs.
2. Appwrite/Postgres transactional budget reservations and append-only ledger.
3. Auction service and documented ranking/clearing rules.
4. Server-verified impression/click measurement and invalid-traffic controls.
5. Payment provider integration, authorization, capture, refunds, receipts, and webhook idempotency.
6. Advertiser reporting and billing dispute workflow.
7. Admin moderation/review and campaign suspension.
8. Load, race-condition, security, accounting, and end-to-end sandbox tests.
