# ConnectTime Advertising Content and Intellectual Property Policy

## Advertising approval gate

An advertisement must not be charged, scheduled, or published until all required checks are complete:
1. Automated AI safety screening of submitted ad text and creative images.
2. Advertiser identity and business verification.
3. Human review of copyright, trademark, publicity-rights, product-claim, and other legal concerns.
4. Explicit campaign approval followed by secure checkout.

A failed, unavailable, timed-out, or inconclusive automated screening result fails closed. It must never be treated as approval. An AI screening pass is only a preliminary safety result and does not authorize payment or publication.

## Prohibited advertising

ConnectTime prohibits ads containing nudity, pornography, sexually explicit or suggestive material, sexual services, sexual exploitation, sexualization of minors, hate, harassment, graphic violence, self-harm promotion, illegal goods or services, scams, deceptive claims, or other material that violates platform rules or applicable law. ConnectTime may reject, pause, or remove ads at its discretion.

## Copyright and trademark requirements

Advertisers must own or hold documented licenses and permissions for every submitted photograph, illustration, video, audio track, font, logo, trademark, slogan, and other protected work. Advertisers must not:
- Copy or upload another person's creative work without permission.
- Use a brand name, logo, trade dress, or endorsement in a way that is unauthorized or misleading.
- Imply sponsorship, affiliation, or endorsement without authorization.
- Use AI-generated or modified material to disguise infringement or misrepresent ownership.

A checkbox or AI scan cannot establish legal ownership. ConnectTime requires a human review of rights declarations and supporting evidence when appropriate. Suspected infringement remains on hold; it cannot be paid for or published.

## Reporting and takedown

Rights holders should be provided a clear reporting channel to identify the protected work, the allegedly infringing advertisement, their contact details, and a good-faith statement of ownership or authorization. ConnectTime should promptly restrict access to a reported ad while reviewing a credible claim, preserve relevant campaign records, notify the advertiser where appropriate, and remove confirmed infringing material. Repeat or deliberate infringement may result in advertiser suspension or termination.

## Current implementation limits

The moderation API performs preliminary AI text/image safety screening only when `OPENAI_API_KEY` is configured. If the key is absent or the provider is unavailable, submission is blocked. The current advertiser planner does not store campaigns, authenticate advertisers, collect payments, publish ads, process takedown notices, or provide a human-review console. Those capabilities must be implemented before commercial ads launch. Do not describe the current planner as a complete ad approval or rights-enforcement system.
