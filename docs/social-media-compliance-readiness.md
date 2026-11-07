# ConnectTime Social Media Compliance Readiness

**Status:** pre-launch work plan and policy drafts, not a legal certification.
**Last reviewed:** 2026-11-07.

## Public routes added

- `/legal/compliance` — compliance overview and launch gates.
- `/legal/privacy` — draft privacy notice.
- `/legal/terms` — draft terms of service.
- `/legal/advertising` — advertising and sponsored-content policy.
- `/legal/copyright` — copyright/DMCA policy information.
- `/community-guidelines` — community expression and anti-harassment rules.
- `/safety` — report, block, and appeal interface.

Signup now requires acknowledgement of Community Guidelines, Terms, and Privacy Notice. This records a user checkbox; it is not proof that the legal terms are complete or that age has been independently verified.

## Legal and operational matrix

| Area | Baseline | Current state | Required before launch |
|---|---|---|---|
| Privacy / NJDPL | Assess scope, thresholds, exemptions, purposes, data minimization, rights, consent, opt-outs, security, and assessments | Draft notice only | Data map, processor list, legal operator/contact, rights workflow, retention schedule, consent/revocation, documented assessments |
| Age / child safety | Adults-only product policy; COPPA and federal child-exploitation duties assessed on actual facts | Signup self-attestation and existing member-access gating design | Independent age assurance, prevention/detection, escalation, preservation/reporting process, specialist response |
| UGC moderation | Clear standards, reports, appeals, safety escalation, fair contextual review | Guidelines and Safety Center UI/API code | Appwrite tables, moderator queue, trained reviewers, role controls, SLA/escalation, audit trail, end-to-end tests |
| Blocking | Respect block relationships throughout product | Block records API | Enforce block relationships across messages, search/discovery, feed, comments, events, and notifications |
| Copyright / DMCA | Designated agent, notice/counter-notice process, repeat-infringer policy if relying on Section 512 | Draft policy; no agent details supplied | Appoint and register agent; publish contact; monitored intake; notice/counter-notice workflow; strike/termination records |
| Ads / endorsements | Truthful ads, clear paid placement and material-connection disclosures, review controls | Auction model and campaign submission/review code | Render visible Ad/Sponsored labels, disclosures in creator content, targeting governance, billing/fee terms, complaints and appeals |
| Security / breach | Least privilege, secure secrets, access monitoring, incident response and applicable breach notice | Some server-side controls exist; full audit not completed | Threat model, penetration/security review, backups/restore, retention/deletion tests, incident plan, vendor DPAs |
| International | Country-specific legal review | International product intent only | Country matrix, localization, transfer mechanisms, local age/content/ads requirements, staged country enablement |

## New Jersey privacy law

ConnectTime is being developed in New Jersey, so obtain counsel's applicability assessment under the New Jersey Data Privacy Act (NJDPL), P.L. 2023, c.266, as amended. Do not assume the Act applies or does not apply without evaluating the operator, consumer counts, processing, revenue, exemptions, and business model.

New Jersey P.L. 2026, c.25 (approved June 30, 2026) amended controller duties to include consent for processing sensitive data, an effective consent-revocation mechanism, and stopping the relevant processing as soon as practicable and no later than 15 days after revocation. It also addresses data protection assessments for heightened-risk processing, including certain targeted advertising, profiling, sale, and sensitive-data processing. The law includes separate data-broker/data-collector provisions. Counsel should confirm effective dates, thresholds, definitions, exceptions, and regulations against ConnectTime's real processing.

**Design implications:** inventory data and purposes; do not collect more than needed; separate sensitive data; obtain and record required consent; make revocation easy; implement applicable access/correction/deletion/portability and opt-out requests; evaluate targeted advertising and profiling; document assessments where required; and maintain security controls.

## New Jersey Age-Appropriate Design Code (P.L. 2026, c.73)

New Jersey enacted the Age-Appropriate Design Code on August 11, 2026; it is scheduled to take effect September 1, 2027. Counsel must analyze the statutory covered-provider scope and exceptions against ConnectTime's revenue, consumer-household processing, features, and likelihood of access by children or minors. If covered, requirements include age-appropriate safeguards and privacy defaults, controls for adult/minor interactions, limits on certain data use and engagement-driving features, accessible harm-reporting and account unpublishing/deletion mechanisms, and protections around recommendation systems and geolocation. Do not assume the 18+ product label alone resolves coverage or future obligations. Build a product design assessment before enabling features that may be attractive to or accessible by minors.

The Act also restricts use and retention of personal data collected for age assurance: age-assurance data must be used only for that purpose and deleted within the statutory period after age determination. Design the verification integration to minimize collection and retain only the minimum decision/audit metadata needed.

## Federal and platform obligations to assess

- **FTC Act and endorsement rules:** advertising claims must be truthful and non-deceptive. A material relationship between an endorser and brand should be disclosed clearly and conspicuously in the endorsement. A profile-only disclosure or vague hashtag may not be sufficient.
- **COPPA:** the amended COPPA Rule became effective June 23, 2025, with most regulated-entity compliance due April 22, 2026. An 18+ label does not by itself resolve COPPA or all child-safety duties. Counsel must assess actual audience, knowledge, collection, and service design. The FTC's February 2026 age-verification policy statement offers conditional enforcement discretion for age-verification-only processing when strict purpose limitation, prompt deletion, security, notice, and provider safeguards are met.
- **18 U.S.C. § 2258A:** assess whether ConnectTime is a provider subject to reporting requirements. Establish a process for appropriate CyberTipline reporting after actual knowledge of facts/circumstances described by the statute, with a designated responsible contact and evidence-handling controls.
- **DMCA Section 512:** eligibility is conditional. The U.S. Copyright Office describes agent registration, public agent contact information, notice-and-takedown, counter-notice, and repeat-infringer policy requirements.
- **Other laws:** review consumer protection, accessibility, privacy/security breach notification, unlawful discrimination, state intimate-image laws, defamation, sanctions/export, and platform-specific requirements as relevant.

## Minimum operational launch gates

1. Confirm the legal operator's name, physical notice address, support/privacy contacts, governing law, and official launch domains.
2. Inventory every data element, purpose, collection point, retention period, recipient, SDK, cookie, processor, and international transfer.
3. Obtain legal review of the policies against actual operations. Replace every draft marker with accurate final language and version the policies.
4. Implement privacy request, appeal, consent, and revocation handling, with verification, deadline tracking, and audit logs.
5. Implement tested age assurance and a child-safety incident response process before enabling member content uploads.
6. Configure Appwrite report/block/appeal tables; add moderator-only queues and authorization; test block enforcement across every relevant surface.
7. Register a DMCA agent if the operator intends to rely on Section 512 safe harbors. Publish actual agent details only after registration is complete.
8. Make paid ads visibly identifiable, include creator disclosure tools, document targeting, and complete billing/cancellation/refund terms before delivery.
9. Run security tests, access reviews, data deletion/backup restore tests, incident simulations, and independent penetration testing appropriate to launch risk.
10. Approve each launch country only after a local legal and operational review.

## Official references

- New Jersey Division of Consumer Affairs, [NJDPL FAQs](https://www.njconsumeraffairs.gov/ocp/Pages/NJ-Data-Privacy-Law-FAQ.aspx).
- New Jersey Legislature, [P.L. 2026, Chapter 25](https://pub.njleg.gov/Bills/2026/AL26/25_.HTM).
- FTC, [Disclosures 101 for Social Media Influencers](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers).
- FTC, [Advertising and Marketing](https://www.ftc.gov/business-guidance/advertising-marketing).
- U.S. Copyright Office, [Section 512 resources](https://www.copyright.gov/512/).
- U.S. Code, [18 U.S.C. § 2258A](https://uscode.house.gov/us/usc/119-124/t18/s2258A/).
- New Jersey Legislature, [A-4015 / New Jersey Age-Appropriate Design Code](https://pub.njleg.gov/Bills/2026/A4500/4015_R3.HTM).
- New Jersey Governor, [August 11, 2026 Kids Code signing announcement](https://www.nj.gov/governor/news/2026/20260811a.shtml).
- FTC, [February 25, 2026 age-verification policy statement](https://www.ftc.gov/news-events/news/press-releases/2026/02/ftc-issues-coppa-policy-statement-incentivize-use-age-verification-technologies-protect-children).
- Federal Register, [2025 COPPA Rule amendments and compliance dates](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm).

## Important limitation

This repository work adds policy drafts, links, and an initial readiness framework. It does not establish that ConnectTime is legally compliant, that every policy applies to every user, or that all technical controls are operational. Obtain advice from qualified U.S. privacy/platform counsel and local counsel for each international market before launch.
