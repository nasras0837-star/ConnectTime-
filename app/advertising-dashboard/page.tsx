"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Campaign = {
  $id: string;
  campaign_name?: string;
  company?: string;
  objective?: string;
  placement?: string;
  region?: string;
  country?: string;
  geo_targets?: string;
  audience_interests?: string;
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
const number = (value?: number) => (Number(value) || 0).toLocaleString();
const pct = (value: number) => `${value.toFixed(2)}%`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : "Not scheduled";
const label = (value?: string) => (value || "draft").replaceAll("_", " ").replaceAll("-", " ").split(" ").map(word => word ? word[0].toUpperCase() + word.slice(1) : word).join(" ");

export default function AdvertisingDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const loadCampaigns = async () => {
    setError("");
    try {
      const response = await fetch("/api/advertising/campaigns", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load campaigns.");
      setCampaigns(data.campaigns || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Campaigns are unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/advertising/campaigns", { cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load campaigns."); return data; })
      .then(data => { if (active) setCampaigns(data.campaigns || []); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Campaigns are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const cancelCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Cancel "${campaign.campaign_name || "this campaign"}"? This cannot be undone.`)) return;
    setUpdatingId(campaign.$id);
    setActionMessage("");
    try {
      const response = await fetch("/api/advertising/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.$id, action: "cancel" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Campaign could not be cancelled.");
      setCampaigns(current => current.map(item => item.$id === campaign.$id ? { ...item, status: "cancelled" } : item));
      setActionMessage(result.message || "Campaign cancelled.");
    } catch (reason) {
      setActionMessage(reason instanceof Error ? reason.message : "Campaign cancellation failed.");
    } finally {
      setUpdatingId("");
    }
  };

  const filtered = useMemo(() => campaigns.filter(campaign => {
    const query = search.trim().toLowerCase();
    const matchesText = !query || [campaign.campaign_name, campaign.company, campaign.country, campaign.region, campaign.geo_targets, campaign.audience_interests].some(value => (value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || (campaign.status || "draft") === statusFilter;
    return matchesText && matchesStatus;
  }), [campaigns, search, statusFilter]);

  const totals = useMemo(() => campaigns.reduce((result, campaign) => {
    result.spend += Number(campaign.spend_minor) || 0;
    result.cap += Number(campaign.lifetime_cap_minor) || 0;
    result.impressions += Number(campaign.impressions_count) || 0;
    result.clicks += Number(campaign.clicks_count) || 0;
    return result;
  }, { spend: 0, cap: 0, impressions: 0, clicks: 0 }), [campaigns]);
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const statuses = Array.from(new Set(campaigns.map(campaign => campaign.status || "draft")));

  return <main className="adMarketplace">
    <header className="adTopbar"><Link href="/advertise" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link><nav><Link href="/advertise">Create campaign</Link><Link href="/">Community</Link></nav></header>
    <section className="ctCampaignDashboard">
      <div className="ctAdDashboardTop"><div><span className="adEyebrow">ADVERTISER CENTER</span><h1>Smart advertising dashboard</h1><p>Create, review, and manage campaigns, understand your selected audiences, and monitor verified delivery performance.</p></div><Link className="ctCampaignCreate" href="/advertise">＋ Create campaign</Link></div>
      <div className="ctCampaignNotice"><strong>Preview / approval status:</strong> Campaign drafts are not published or charged. Impressions and clicks are shown only when verified delivery events are configured. AI screening is not final approval; human review and secure billing are still required before launch.</div>
      {actionMessage && <div className="ctCampaignNotice" role="status">{actionMessage}</div>}
      <div className="ctAdKpis">
        <article><span>CAMPAIGNS</span><strong>{campaigns.length}</strong><small>{campaigns.filter(c => c.status === "pending_review").length} awaiting review</small></article>
        <article><span>RECORDED SPEND</span><strong>{money(totals.spend)}</strong><small>Verified spend records only</small></article>
        <article><span>AD IMPRESSIONS</span><strong>{number(totals.impressions)}</strong><small>Verified delivery events</small></article>
        <article><span>CLICK-THROUGH RATE</span><strong>{pct(ctr)}</strong><small>{number(totals.clicks)} verified clicks</small></article>
        <article><span>AVERAGE COST / CLICK</span><strong>{money(cpc)}</strong><small>Only when verified spend and clicks exist</small></article>
      </div>
      <section className="ctAdCampaignTools" aria-label="Campaign filters">
        <label>Search campaigns<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, campaign, location or interest" /></label>
        <label>Campaign status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></label>
        <button type="button" onClick={() => { setRefreshing(true); void loadCampaigns(); }} disabled={refreshing || loading}>{refreshing ? "Refreshing…" : "↻ Refresh data"}</button>
      </section>
      {loading ? <div className="ctCampaignEmpty">Loading your campaigns…</div> : error ? <div className="ctCampaignEmpty" role="alert">{error}<p><Link href="/login">Sign in</Link> if you are not already signed in, and confirm your verified member access is configured.</p></div> : campaigns.length === 0 ? <div className="ctCampaignEmpty">You have no saved campaigns yet. <Link href="/advertise">Create your first campaign ↗</Link></div> : filtered.length === 0 ? <div className="ctCampaignEmpty">No campaigns match these filters. Try another search or status.</div> : <div className="ctCampaignList">{filtered.map(campaign => {
        const impressions = Number(campaign.impressions_count) || 0;
        const clicks = Number(campaign.clicks_count) || 0;
        const spend = Number(campaign.spend_minor) || 0;
        const cap = Number(campaign.lifetime_cap_minor) || 0;
        const spendPercent = cap > 0 ? Math.min(100, spend / cap * 100) : 0;
        const campaignCtr = impressions > 0 ? clicks / impressions * 100 : 0;
        const canCancel = !["cancelled", "completed", "rejected"].includes(campaign.status || "");
        return <article className="ctCampaignCard" key={campaign.$id}>
          <div className="ctCampaignTitle"><div><span>{campaign.company || "Advertiser"}</span><h2>{campaign.campaign_name || "Untitled campaign"}</h2></div><b className={campaign.status === "approved" || campaign.status === "active" ? "ctAdStatus positive" : "ctAdStatus"}>{label(campaign.status)}</b></div>
          <div className="ctCampaignMetrics"><div><small>DAILY BUDGET</small><strong>{money(campaign.daily_budget_minor)}</strong></div><div><small>TOTAL SPEND CAP</small><strong>{money(campaign.lifetime_cap_minor)}</strong></div><div><small>RECORDED SPEND</small><strong>{money(campaign.spend_minor)}</strong></div><div><small>IMPRESSIONS</small><strong>{number(impressions)}</strong></div><div><small>CLICKS</small><strong>{number(clicks)}</strong></div><div><small>CTR</small><strong>{pct(campaignCtr)}</strong></div></div>
          <div className="ctAdSpendTrack" aria-label={`Spend cap used: ${spendPercent.toFixed(1)} percent`}><span style={{ width: `${spendPercent}%` }} /></div><div className="ctAdSpendCaption"><span>{money(spend)} recorded</span><span>{money(Math.max(0, cap - spend))} remaining of cap</span></div>
          <div className="ctAdAudience"><div><small>OBJECTIVE & PLACEMENT</small><strong>{label(campaign.objective)} · {label(campaign.placement)}</strong></div><div><small>TARGET AUDIENCE</small><strong>{campaign.country || "Country not set"} · {campaign.region || "Region not set"}</strong>{campaign.geo_targets && <span>{campaign.geo_targets}</span>}{campaign.audience_interests && <span>Interests: {campaign.audience_interests.split(",").filter(Boolean).join(" · ")}</span>}</div><div><small>SCHEDULE</small><strong>{date(campaign.starts_at)} – {date(campaign.ends_at)}</strong></div></div>
          <div className="ctCampaignMeta"><span>AI screen: {label(campaign.moderation_status)}</span><span>Human review: {label(campaign.human_review_status)}</span><span>Payment: {label(campaign.payment_status)}</span><span>Metrics: {campaign.metrics_status === "verified_events" ? "Verified events" : campaign.metrics_status === "temporarily_unavailable" ? "Temporarily unavailable" : "Not active"}</span></div>
          {canCancel && <div className="ctCampaignActions"><button type="button" onClick={() => void cancelCampaign(campaign)} disabled={updatingId === campaign.$id}>{updatingId === campaign.$id ? "Cancelling…" : "Cancel campaign"}</button></div>}
        </article>;
      })}</div>}
      <p className="ctAdDashboardFoot">Reporting is calculated from verified event records returned by ConnectTime's campaign API. Estimated reach, demographic predictions, and unverified views are not presented as actual performance. Campaign cancellation is advertiser-scoped and cannot approve, bill, or relaunch an ad.</p>
    </section>
  </main>;
}
