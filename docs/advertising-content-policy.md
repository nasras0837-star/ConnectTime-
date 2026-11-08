# Connect Advertising Content and Intellectual Property Policy

## Advertising approval gate

An advertisement must not be charged, scheduled, or published until all required checks are complete:
1. Automated AI safety screening of submitted ad text and creative images.
2. Advertiser identity and business verification.
3. Human review of copyright, trademark, publicity-rights, product-claim, and other legal concerns.
4. Explicit campaign approval followed by secure checkout.

A failed, unavailable, timed-out, or inconclusive automated screening result fails closed. It must never be treated as approval. An AI screening pass is only a preliminary safety result and does not authorize payment or publication.

## Prohibited advertising

Connect prohibits ads containing nudity, pornography, sexually explicit or suggestive material, sexual services, sexual exploitation, sexualization of minors, hate, harassment, graphic violence, self-harm promotion, illegal goods or services, scams, deceptive claims, or other material that violates platform rules or applicable law. Connect may reject, pause, or remove ads at its discretion.

## Copyright and trademark requirements

Advertisers must own or hold documented licenses and permissions for every submitted photograph, illustration, video, audio track, font, logo, trademark, slogan, and other protected work. Advertisers must not:
- Copy or upload another person's creative work without permission.
- Use a brand name, logo, trade dress, or endorsement in a way that is unauthorized or misleading.
- Imply sponsorship, affiliation, or endorsement without authorization.
- Use AI-generated or modified material to disguise infringement or misrepresent ownership.

A checkbox or AI scan cannot establish legal ownership. Connect requires a human review of rights declarations and supporting evidence when appropriate. Suspected infringement remains on hold; it cannot be paid for or published.

## Reporting and takedown

Rights holders should be provided a clear reporting channel to identify the protected work, the allegedly infringing advertisement, their contact details, and a good-faith statement of ownership or authorization. Connect should promptly restrict access to a reported ad while reviewing a credible claim, preserve relevant campaign records, notify the advertiser where appropriate, and remove confirmed infringing material. Repeat or deliberate infringement may result in advertiser suspension or termination.

## Current implementation limits

The moderation API performs preliminary AI text/image safety screening only when `OPENAI_API_KEY` is configured. If the key is absent or the provider is unavailable, submission is blocked. The current advertiser planner does not store campaigns, authenticate advertisers, collect payments, publish ads, process takedown notices, or provide a human-review console. Those capabilities must be implemented before commercial ads launch. Do not describe the current planner as a complete ad approval or rights-enforcement system.


## Auction pricing and advertiser budgets

Connect does not charge a fixed monthly price per advertisement. Advertisers set their own campaign budgets and participate in an auction when an eligible placement becomes available. The initial campaign planner supports a minimum daily budget of **US$1**, a separate total campaign spending cap, and a choice of bidding strategy. These are planning controls only until auction delivery and billing are implemented.

- **Daily budget:** the advertiser's intended average daily spend limit.
- **Lifetime campaign cap:** the hard maximum amount that may be charged for the campaign. The campaign must stop when this cap is reached.
- **Auction price:** determined by competition for the eligible audience and placement, bid strategy, campaign objective, geography, and ad quality. No fixed CPC, CPM, CPL, or guaranteed result is promised.
- **Billing basis:** before launch, each campaign must clearly disclose whether it is billed for valid impressions (CPM), valid clicks (CPC), or another explicitly supported event. Never charge for both an impression and a click for the same event unless the advertiser expressly selects and accepts a disclosed pricing model.
- **Spend controls:** Connect's initial billing design should use a strict no-overdelivery rule: do not exceed the daily pacing limit or lifetime cap. Pause delivery when the cap is reached, when payment authorization fails, or when the campaign is paused or rejected. Do not silently increase an advertiser's budget.
- **Transparency:** show spend, remaining budget, delivery counts, billing events, and campaign status. Provide an itemized invoice/receipt and a way to dispute invalid traffic or billing errors.
- **No charge before approval:** do not collect campaign funds or begin billable delivery until advertiser checks, creative moderation, required human review, and secure checkout/authorization are complete.

Auction delivery, real-time bid competition, pacing, invalid-traffic filtering, reporting, and payment collection are not yet active in the current preview. The planner does not create a payable campaign or authorize ad publication.