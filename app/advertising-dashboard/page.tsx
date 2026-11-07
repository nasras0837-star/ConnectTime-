"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Campaign = {
  $id: string;
  campaign_name?: string;
  company?: string;
  objective?: string;
  country?: string;
  daily_budget_minor?: number;
  lifetime_cap_minor?: number;
  spend_minor?: number;
  impressions_count?: number;
  clicks_count?: number;
  status?: string;
  moderation_status?: string;
  human_review_status?: string;
  payment_status?: string;
  metrics_status?: string;
  starts_at?: string;
  ends_at?: string;
};

const money = (minor?: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format((Number(minor) || 0) / 100);

export default function AdvertisingDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/advertising/campaigns", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load campaigns.");
        return data;
      })
      .then((data) => { if (active) setCampaigns(data.campaigns || []); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Campaigns are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <main className="adMarketplace">
    <header className="adTopbar"><Link href="/advertise" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link><nav><Link href="/advertise">Create campaign</Link><Link href="/">Community</Link></nav></header>
    <section className="ctCampaignDashboard">
      <span className="adEyebrow">ADVERTISER CENTER</span><h1>Your campaigns</h1>
      <p>Review your campaign budgets, approval status, recorded ad views (impressions), and clicks.</p>
      <div className="ctCampaignNotice">Campaigns shown here are drafts only. Ad views and clicks will be counted from verified delivery events after a campaign is approved and the ad delivery system is enabled. Drafts currently show zero recorded views and clicks; no campaign is charged or published.</div>
      {loading ? <div className="ctCampaignEmpty">Loading your campaigns…</div> : error ? <div className="ctCampaignEmpty" role="alert">{error}<p><Link href="/login">Sign in</Link> if you are not already signed in, and confirm your verified member access is configured.</p></div> : campaigns.length === 0 ? <div className="ctCampaignEmpty">You have no saved campaigns yet. <Link href="/advertise">Create your first campaign ↗</Link></div> : <div className="ctCampaignList">{campaigns.map((campaign) => <article className="ctCampaignCard" key={campaign.$id}>
        <div className="ctCampaignTitle"><div><span>{campaign.company || "Advertiser"}</span><h2>{campaign.campaign_name || "Untitled campaign"}</h2></div><b>{campaign.status || "draft"}</b></div>
        <div className="ctCampaignMetrics"><div><small>DAILY BUDGET</small><strong>{money(campaign.daily_budget_minor)}</strong></div><div><small>TOTAL SPEND CAP</small><strong>{money(campaign.lifetime_cap_minor)}</strong></div><div><small>SPEND RECORDED</small><strong>{money(campaign.spend_minor)}</strong></div><div><small>AD VIEWS</small><strong>{Number(campaign.impressions_count || 0).toLocaleString()}</strong></div><div><small>CLICKS</small><strong>{Number(campaign.clicks_count || 0).toLocaleString()}</strong></div></div>
        <div className="ctCampaignMeta"><span>{campaign.country || "Location not set"}</span><span>AI: {campaign.moderation_status || "pending"}</span><span>Human review: {campaign.human_review_status || "not started"}</span><span>Payment: {campaign.payment_status || "not started"}</span><span>Metrics: {campaign.metrics_status === "verified_events" ? "verified delivery events" : campaign.metrics_status === "temporarily_unavailable" ? "temporarily unavailable" : "not yet active"}</span></div>
      </article>)}</div>}
      <Link className="ctCampaignCreate" href="/advertise">＋ Create another campaign</Link>
    </section>
  </main>;
}
