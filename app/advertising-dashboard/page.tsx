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
const csvCell = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
};

export default function AdvertisingDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [metricsFilter, setMetricsFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadCampaigns = async () => {
    setError("");
    try {
      const response = await fetch("/api/advertising/campaigns", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load campaigns.");
      setCampaigns(data.campaigns || []);
      setLastUpdated(new Date().toISOString());
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
      .then(data => { if (active) { setCampaigns(data.campaigns || []); setLastUpdated(new Date().toISOString()); } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Campaigns are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => campaigns.filter(campaign => {
    const query = search.trim().toLowerCase();
    const matchesText = !query || [campaign.campaign_name, campaign.company, campaign.country, campaign.region].some(value => (value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || (campaign.status || "draft") === statusFilter;
    const metricsVerified = campaign.metrics_status === "verified_events";
    const matchesMetrics = metricsFilter === "all" || (metricsFilter === "verified" && metricsVerified) || (metricsFilter === "unverified" && !metricsVerified);
    const start = campaign.starts_at ? Date.parse(campaign.starts_at) : Number.NaN;
    const end = campaign.ends_at ? Date.parse(campaign.ends_at) : Number.NaN;
    const now = Date.now();
    const hasSchedule = Number.isFinite(start) && Number.isFinite(end);
    const matchesSchedule = scheduleFilter === "all" ||
      (scheduleFilter === "unscheduled" && !hasSchedule) ||
      (scheduleFilter === "upcoming" && hasSchedule && start > now) ||
      (scheduleFilter === "current" && hasSchedule && start <= now && end >= now) ||
      (scheduleFilter === "ended" && hasSchedule && end < now);
    return matchesText && matchesStatus && matchesSchedule;
  }), [campaigns, search, statusFilter, scheduleFilter]);

  const sortedCampaigns = useMemo(() => [...filtered].sort((a, b) => {
    const dateA = Date.parse(a.starts_at || "") || 0;
    const dateB = Date.parse(b.starts_at || "") || 0;
    const spendA = Number(a.spend_minor) || 0;
    const spendB = Number(b.spend_minor) || 0;
    const impressionsA = a.metrics_status === "verified_events" ? Number(a.impressions_count) || 0 : 0;
    const impressionsB = b.metrics_status === "verified_events" ? Number(b.impressions_count) || 0 : 0;
    const clicksA = a.metrics_status === "verified_events" ? Number(a.clicks_count) || 0 : 0;
    const clicksB = b.metrics_status === "verified_events" ? Number(b.clicks_count) || 0 : 0;
    const ctrA = impressionsA > 0 ? clicksA / impressionsA : 0;
    const ctrB = impressionsB > 0 ? clicksB / impressionsB : 0;
    if (sortOrder === "oldest") return dateA - dateB;
    if (sortOrder === "spend_high") return spendB - spendA;
    if (sortOrder === "spend_low") return spendA - spendB;
    if (sortOrder === "ctr_high") return ctrB - ctrA;
    return dateB - dateA;
  }), [filtered, sortOrder]);

  const totals = useMemo(() => filtered.reduce((result, campaign) => {
    result.spend += Number(campaign.spend_minor) || 0;
    result.cap += Number(campaign.lifetime_cap_minor) || 0;
    if (campaign.metrics_status === "verified_events") {
      result.impressions += Number(campaign.impressions_count) || 0;
      result.clicks += Number(campaign.clicks_count) || 0;
    }
    return result;
  }, { spend: 0, cap: 0, impressions: 0, clicks: 0 }), [filtered]);
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions * 100 : 0;
  const statuses = Array.from(new Set(campaigns.map(campaign => campaign.status || "draft")));

  const exportCampaigns = () => {
    const columns = [
      "Campaign", "Company", "Status", "Objective", "Placement", "Country", "Region",
      "Audience interests", "Daily budget (USD)", "Lifetime cap (USD)", "Recorded spend (USD)",
      "Verified impressions", "Verified clicks", "Verified CTR", "Metrics status",
      "AI screening", "Human review", "Payment status", "Start date", "End date"
    ];
    const rows = sortedCampaigns.map(campaign => {
      const verified = campaign.metrics_status === "verified_events";
      const impressions = verified ? Number(campaign.impressions_count) || 0 : null;
      const clicks = verified ? Number(campaign.clicks_count) || 0 : null;
      const ctrValue = impressions && impressions > 0 ? (clicks || 0) / impressions * 100 : null;
      return [
        campaign.campaign_name, campaign.company, label(campaign.status), label(campaign.objective),
        label(campaign.placement), campaign.country, campaign.region, campaign.audience_interests,
        ((Number(campaign.daily_budget_minor) || 0) / 100).toFixed(2),
        ((Number(campaign.lifetime_cap_minor) || 0) / 100).toFixed(2),
        ((Number(campaign.spend_minor) || 0) / 100).toFixed(2),
        impressions === null ? "Not verified" : impressions,
        clicks === null ? "Not verified" : clicks,
        ctrValue === null ? "Not available" : ctrValue.toFixed(2) + "%",
        label(campaign.metrics_status), label(campaign.moderation_status),
        label(campaign.human_review_status), label(campaign.payment_status),
        campaign.starts_at, campaign.ends_at
      ];
    });
    const csv = [columns, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "connecttime-campaign-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return <main className="adMarketplace">
    <header className="adTopbar"><Link href="/advertise" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link><nav><Link href="/advertise">Create campaign</Link><Link href="/">Community</Link></nav></header>
    <section className="ctCampaignDashboard">
      <div className="ctAdDashboardTop"><div><span className="adEyebrow">ADVERTISER CENTER</span><h1>Campaign performance</h1><p>Manage your campaign plans, review audience targeting, and monitor verified delivery metrics.</p></div><Link className="ctCampaignCreate" href="/advertise">＋ Create campaign</Link></div>
      <div className="ctCampaignNotice"><strong>Preview / approval status:</strong> Campaign drafts are not published or charged. Impressions and clicks are shown only when verified delivery events are configured. AI screening is not final approval; human review and secure billing are still required before launch.</div>
      <div className="ctAdKpis">
        <article><span>MATCHING CAMPAIGNS</span><strong>{filtered.length}</strong><small>{filtered.filter(c => c.status === "pending_review").length} awaiting review</small></article>
        <article><span>FILTERED RECORDED SPEND</span><strong>{money(totals.spend)}</strong><small>For campaigns matching your filters</small></article>
        <article><span>FILTERED IMPRESSIONS</span><strong>{number(totals.impressions)}</strong><small>Verified-event campaigns only</small></article>
        <article><span>FILTERED CLICK-THROUGH RATE</span><strong>{pct(ctr)}</strong><small>{number(totals.clicks)} verified clicks only</small></article>
      </div>
      <section className="ctAdCampaignTools" aria-label="Campaign filters">
        <label>Search campaigns<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, campaign or location" /></label>
        <label>Campaign status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></label>
        <label>Campaign schedule<select value={scheduleFilter} onChange={event => setScheduleFilter(event.target.value)}><option value="all">All schedules</option><option value="upcoming">Upcoming</option><option value="current">Currently scheduled</option><option value="ended">Ended</option><option value="unscheduled">Missing schedule</option></select></label>
        <label>Metrics verification<select value={metricsFilter} onChange={event => setMetricsFilter(event.target.value)}><option value="all">All metrics</option><option value="verified">Verified metrics</option><option value="unverified">Not verified</option></select></label>
        <label>Sort campaigns<select value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="newest">Newest start date</option><option value="oldest">Oldest start date</option><option value="spend_high">Highest recorded spend</option><option value="spend_low">Lowest recorded spend</option><option value="ctr_high">Highest verified CTR</option></select></label>
        {(search.trim() || statusFilter !== "all" || scheduleFilter !== "all" || metricsFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setScheduleFilter("all"); setMetricsFilter("all"); }}>Clear filters</button>}
        <button type="button" onClick={exportCampaigns} disabled={loading || !!error || filtered.length === 0}>↓ Export filtered CSV ({filtered.length})</button>
        <button type="button" onClick={() => { setRefreshing(true); void loadCampaigns(); }} disabled={refreshing || loading}>{refreshing ? "Refreshing…" : "↻ Refresh data"}</button>
      </section>
      {!loading && !error && <p className="ctCampaignResultCount" aria-live="polite">{campaigns.length > 0 ? `Showing ${filtered.length} of ${campaigns.length} campaigns` : "Campaign list loaded"}{lastUpdated ? ` · Data refreshed ${new Date(lastUpdated).toLocaleString()}` : ""}</p>}
      {loading ? <div className="ctCampaignEmpty">Loading your campaigns…</div> : error ? <div className="ctCampaignEmpty" role="alert">{error}<p><Link href="/login">Sign in</Link> if you are not already signed in, and confirm your verified member access is configured.</p></div> : campaigns.length === 0 ? <div className="ctCampaignEmpty">You have no saved campaigns yet. <Link href="/advertise">Create your first campaign ↗</Link></div> : filtered.length === 0 ? <div className="ctCampaignEmpty">No campaigns match these filters. Try another search or status. <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setScheduleFilter("all"); setMetricsFilter("all"); }}>Clear all filters</button></div> : <div className="ctCampaignList">{sortedCampaigns.map(campaign => {
        const metricsVerified = campaign.metrics_status === "verified_events";
        const impressions = metricsVerified ? Number(campaign.impressions_count) || 0 : 0;
        const clicks = metricsVerified ? Number(campaign.clicks_count) || 0 : 0;
        const spend = Number(campaign.spend_minor) || 0;
        const cap = Number(campaign.lifetime_cap_minor) || 0;
        const spendPercent = cap > 0 ? Math.min(100, spend / cap * 100) : 0;
        const campaignCtr = impressions > 0 ? clicks / impressions * 100 : 0;
        return <article className="ctCampaignCard" key={campaign.$id}>
          <div className="ctCampaignTitle"><div><span>{campaign.company || "Advertiser"}</span><h2>{campaign.campaign_name || "Untitled campaign"}</h2></div><b className={campaign.status === "approved" || campaign.status === "active" ? "ctAdStatus positive" : "ctAdStatus"}>{label(campaign.status)}</b></div>
          <div className="ctCampaignMetrics"><div><small>DAILY BUDGET</small><strong>{money(campaign.daily_budget_minor)}</strong></div><div><small>TOTAL SPEND CAP</small><strong>{money(campaign.lifetime_cap_minor)}</strong></div><div><small>RECORDED SPEND</small><strong>{money(campaign.spend_minor)}</strong></div><div><small>VERIFIED IMPRESSIONS</small><strong>{metricsVerified ? number(impressions) : "Not verified"}</strong></div><div><small>VERIFIED CLICKS</small><strong>{metricsVerified ? number(clicks) : "Not verified"}</strong></div><div><small>VERIFIED CTR</small><strong>{metricsVerified ? pct(campaignCtr) : "Not available"}</strong></div></div>
          <div className="ctAdSpendTrack" aria-label={`Spend cap used: ${spendPercent.toFixed(1)} percent`}><span style={{ width: `${spendPercent}%` }} /></div><div className="ctAdSpendCaption"><span>{money(spend)} recorded</span><span>{money(Math.max(0, cap - spend))} remaining of cap</span></div>
          <div className="ctAdAudience"><div><small>OBJECTIVE & PLACEMENT</small><strong>{label(campaign.objective)} · {label(campaign.placement)}</strong></div><div><small>TARGET AUDIENCE</small><strong>{campaign.country || "Country not set"} · {campaign.region || "Region not set"}</strong>{campaign.geo_targets && <span>{campaign.geo_targets}</span>}{campaign.audience_interests && <span>Interests: {campaign.audience_interests.split(",").filter(Boolean).join(" · ")}</span>}</div><div><small>SCHEDULE</small><strong>{date(campaign.starts_at)} – {date(campaign.ends_at)}</strong></div></div>
          <div className="ctCampaignMeta"><span>AI screen: {label(campaign.moderation_status)}</span><span>Human review: {label(campaign.human_review_status)}</span><span>Payment: {label(campaign.payment_status)}</span><span>Metrics: {campaign.metrics_status === "verified_events" ? "Verified events" : campaign.metrics_status === "temporarily_unavailable" ? "Temporarily unavailable" : "Not active"}</span></div>
        </article>;
      })}</div>}
      <p className="ctAdDashboardFoot">Reporting is calculated from verified event records returned by ConnectTime's campaign API. Estimated reach, demographic predictions, and unverified views are not presented as actual performance.</p>
    </section>
  </main>;
}
