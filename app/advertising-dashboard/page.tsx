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
const scheduleStatus = (campaign: Campaign, now = Date.now()) => {
  const start = campaign.starts_at ? Date.parse(campaign.starts_at) : Number.NaN;
  const end = campaign.ends_at ? Date.parse(campaign.ends_at) : Number.NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Unscheduled";
  if (end < start) return "Invalid schedule";
  if (end < now) return "Ended";
  if (start > now) return "Upcoming";
  return "Currently scheduled";
};
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
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

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
    const matchesText = !query || [campaign.$id, campaign.campaign_name, campaign.company, campaign.country, campaign.region, campaign.objective, campaign.placement, campaign.audience_interests, campaign.geo_targets].some(value => (value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || (campaign.status || "draft") === statusFilter;
    const metricsVerified = campaign.metrics_status === "verified_events";
    const matchesMetrics = metricsFilter === "all" || (metricsFilter === "verified" && metricsVerified) || (metricsFilter === "unverified" && !metricsVerified);
    const spend = Number(campaign.spend_minor) || 0;
    const cap = Number(campaign.lifetime_cap_minor) || 0;
    const matchesBudget = budgetFilter === "all" ||
      (budgetFilter === "over_cap" && cap > 0 && spend > cap) ||
      (budgetFilter === "within_cap" && cap > 0 && spend <= cap) ||
      (budgetFilter === "no_cap" && cap <= 0);
    const review = (campaign.human_review_status || "").toLowerCase();
    const effectiveReview = review || (campaign.status === "pending_review" ? "pending" : "");
    const matchesReview = reviewFilter === "all" ||
      (reviewFilter === "pending" && effectiveReview === "pending") ||
      (reviewFilter === "approved" && effectiveReview === "approved") ||
      (reviewFilter === "rejected" && effectiveReview === "rejected") ||
      (reviewFilter === "not_recorded" && !effectiveReview);
    const start = campaign.starts_at ? Date.parse(campaign.starts_at) : Number.NaN;
    const end = campaign.ends_at ? Date.parse(campaign.ends_at) : Number.NaN;
    const hasSchedule = Number.isFinite(start) && Number.isFinite(end);
    const invalidSchedule = hasSchedule && end < start;
    const matchesSchedule = scheduleFilter === "all" ||
      (scheduleFilter === "unscheduled" && !hasSchedule) ||
      (scheduleFilter === "invalid" && invalidSchedule) ||
      (scheduleFilter === "upcoming" && hasSchedule && !invalidSchedule && start > now) ||
      (scheduleFilter === "current" && hasSchedule && !invalidSchedule && start <= now && end >= now) ||
      (scheduleFilter === "ended" && hasSchedule && !invalidSchedule && end < now);
    return matchesText && matchesStatus && matchesSchedule && matchesMetrics && matchesBudget && matchesReview;
  }), [campaigns, search, statusFilter, scheduleFilter, metricsFilter, budgetFilter, reviewFilter, now]);

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

  const pageCount = Math.max(1, Math.ceil(sortedCampaigns.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCampaigns = useMemo(() => sortedCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sortedCampaigns, currentPage, pageSize]);
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
    const last = Math.min(pageCount, first + 4);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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
  const dataQuality = useMemo(() => filtered.reduce((result, campaign) => {
    if (campaign.metrics_status !== "verified_events") result.unverifiedMetrics += 1;
    if ((Number(campaign.lifetime_cap_minor) || 0) > 0 && (Number(campaign.spend_minor) || 0) > (Number(campaign.lifetime_cap_minor) || 0)) result.overCap += 1;
    if (scheduleStatus(campaign, now) === "Unscheduled") result.unscheduled += 1;
    if (scheduleStatus(campaign, now) === "Invalid schedule") result.invalidSchedules += 1;
    return result;
  }, { unverifiedMetrics: 0, overCap: 0, unscheduled: 0, invalidSchedules: 0 }), [filtered, now]);
  const reviewSummary = useMemo(() => filtered.reduce((result, campaign) => {
    const recordedReview = (campaign.human_review_status || "").toLowerCase();
    const effectiveReview = recordedReview || (campaign.status === "pending_review" ? "pending" : "");
    if (effectiveReview === "pending") result.pending += 1;
    else if (effectiveReview === "approved") result.approved += 1;
    else if (effectiveReview === "rejected") result.rejected += 1;
    else result.notRecorded += 1;
    return result;
  }, { pending: 0, approved: 0, rejected: 0, notRecorded: 0 }), [filtered]);
  const statuses = Array.from(new Set(campaigns.map(campaign => campaign.status || "draft")));

  const copyCampaignId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedCampaignId(id);
      window.setTimeout(() => setCopiedCampaignId(current => current === id ? null : current), 1800);
    } catch {
      setError("Could not copy the campaign ID. Check your browser clipboard permissions.");
    }
  };

  const exportCampaigns = () => {
    const columns = [
      "Campaign ID", "Campaign", "Company", "Status", "Objective", "Placement", "Country", "Region",
      "Geographic targeting details", "Audience interests", "Daily budget (USD)", "Lifetime cap (USD)", "Recorded spend (USD)",
      "Verified impressions", "Verified clicks", "Verified CTR", "Schedule status", "Metrics status",
      "AI screening", "Human review", "Payment status", "Start date", "End date"
    ];
    const rows = sortedCampaigns.map(campaign => {
      const verified = campaign.metrics_status === "verified_events";
      const impressions = verified ? Number(campaign.impressions_count) || 0 : null;
      const clicks = verified ? Number(campaign.clicks_count) || 0 : null;
      const ctrValue = impressions && impressions > 0 ? (clicks || 0) / impressions * 100 : null;
      return [
        campaign.$id, campaign.campaign_name, campaign.company, label(campaign.status), label(campaign.objective),
        label(campaign.placement), campaign.country, campaign.region, campaign.geo_targets, campaign.audience_interests,
        ((Number(campaign.daily_budget_minor) || 0) / 100).toFixed(2),
        ((Number(campaign.lifetime_cap_minor) || 0) / 100).toFixed(2),
        ((Number(campaign.spend_minor) || 0) / 100).toFixed(2),
        impressions === null ? "Not verified" : impressions,
        clicks === null ? "Not verified" : clicks,
        ctrValue === null ? "Not available" : ctrValue.toFixed(2) + "%",
        scheduleStatus(campaign, now), label(campaign.metrics_status), label(campaign.moderation_status),
        label(campaign.human_review_status), label(campaign.payment_status),
        campaign.starts_at, campaign.ends_at
      ];
    });
    const csv = [columns, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const reportDate = new Date().toISOString().slice(0, 10);
    link.download = `connecttime-campaign-report-${reportDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Keep the object URL alive briefly so browsers can begin the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <main className="adMarketplace">
    <header className="adTopbar"><Link href="/advertise" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link><nav><Link href="/advertise">Create campaign</Link><Link href="/">Community</Link></nav></header>
    <section className="ctCampaignDashboard">
      <div className="ctAdDashboardTop"><div><span className="adEyebrow">ADVERTISER CENTER</span><h1>Campaign performance</h1><p>Manage your campaign plans, review audience targeting, and monitor verified delivery metrics.</p></div><Link className="ctCampaignCreate" href="/advertise">＋ Create campaign</Link></div>
      <div className="ctCampaignNotice"><strong>Preview / approval status:</strong> Campaign drafts are not published or charged. Impressions and clicks are shown only when verified delivery events are configured. AI screening is not final approval; human review and secure billing are still required before launch.</div>
      <div className="ctAdKpis">
        <article><span>MATCHING CAMPAIGNS</span><strong>{filtered.length}</strong><small>{filtered.filter(c => c.status === "pending_review").length} awaiting review</small></article>
        <article><span>FILTERED RECORDED SPEND</span><strong>{money(totals.spend)}</strong><small>{money(totals.cap)} combined lifetime caps · {totals.cap > 0 ? `${(totals.spend / totals.cap * 100).toFixed(1)}% of cap recorded${totals.spend > totals.cap ? " · OVER CAP" : ""}` : "No lifetime caps recorded"}</small></article>
        <article><span>FILTERED IMPRESSIONS</span><strong>{number(totals.impressions)}</strong><small>Verified-event campaigns only</small></article>
        <article><span>FILTERED CLICK-THROUGH RATE</span><strong>{pct(ctr)}</strong><small>{number(totals.clicks)} verified clicks only</small></article>
      </div>
      <div className="ctCampaignNotice" aria-live="polite"><strong>Filtered data-quality review:</strong> {dataQuality.unverifiedMetrics} campaign(s) without verified delivery metrics · {dataQuality.overCap} campaign(s) over lifetime cap · {dataQuality.unscheduled} campaign(s) without a complete schedule · {dataQuality.invalidSchedules} campaign(s) with an end date before their start date. These counts reflect the current filters.</div>
      <section className="ctAdKpis" aria-label="Human review summary">
        <article><span>AWAITING HUMAN REVIEW</span><strong>{reviewSummary.pending}</strong><small>Filtered campaigns awaiting a decision</small></article>
        <article><span>APPROVED BY HUMAN REVIEW</span><strong>{reviewSummary.approved}</strong><small>Review status recorded as approved</small></article>
        <article><span>REJECTED BY HUMAN REVIEW</span><strong>{reviewSummary.rejected}</strong><small>Review status recorded as rejected</small></article>
        <article><span>REVIEW NOT RECORDED</span><strong>{reviewSummary.notRecorded}</strong><small>No human-review decision recorded</small></article>
      </section>
      <section className="ctAdCampaignTools" aria-label="Campaign filters">
        <label>Search campaigns<input value={search} onChange={event => { setPage(1); setSearch(event.target.value); }} placeholder="Search campaign, company, location, objective or interests" /></label>
        <label>Campaign status<select value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }}><option value="all">All statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></label>
        <label>Campaign schedule<select value={scheduleFilter} onChange={event => { setPage(1); setScheduleFilter(event.target.value); }}><option value="all">All schedules</option><option value="upcoming">Upcoming</option><option value="current">Currently scheduled</option><option value="ended">Ended</option><option value="unscheduled">Missing schedule</option><option value="invalid">Invalid date range</option></select></label>
        <label>Metrics verification<select value={metricsFilter} onChange={event => { setPage(1); setMetricsFilter(event.target.value); }}><option value="all">All metrics</option><option value="verified">Verified metrics</option><option value="unverified">Not verified</option></select></label>
        <label>Budget status<select value={budgetFilter} onChange={event => { setPage(1); setBudgetFilter(event.target.value); }}><option value="all">All budget statuses</option><option value="over_cap">Over lifetime cap</option><option value="within_cap">Within lifetime cap</option><option value="no_cap">No lifetime cap</option></select></label>
        <label>Human review<select value={reviewFilter} onChange={event => { setPage(1); setReviewFilter(event.target.value); }}><option value="all">All review statuses</option><option value="pending">Awaiting review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="not_recorded">Not recorded</option></select></label>
        <label>Sort campaigns<select value={sortOrder} onChange={event => { setPage(1); setSortOrder(event.target.value); }}><option value="newest">Newest start date</option><option value="oldest">Oldest start date</option><option value="spend_high">Highest recorded spend</option><option value="spend_low">Lowest recorded spend</option><option value="ctr_high">Highest verified CTR</option></select></label>
        {(search.trim() || statusFilter !== "all" || scheduleFilter !== "all" || metricsFilter !== "all" || budgetFilter !== "all" || reviewFilter !== "all") && <button type="button" onClick={() => { setPage(1); setSearch(""); setStatusFilter("all"); setScheduleFilter("all"); setMetricsFilter("all"); setBudgetFilter("all"); setReviewFilter("all"); }}>Clear filters</button>}
        <button type="button" onClick={exportCampaigns} disabled={loading || !!error || filtered.length === 0}>↓ Export filtered CSV ({filtered.length})</button>
        <button type="button" onClick={() => { setRefreshing(true); void loadCampaigns(); }} disabled={refreshing || loading}>{refreshing ? "Refreshing…" : "↻ Refresh data"}</button>
      </section>
      {!loading && !error && <p className="ctCampaignResultCount" aria-live="polite">{campaigns.length > 0 ? `Showing ${filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} matching campaigns (${campaigns.length} total)` : "Campaign list loaded"}{lastUpdated ? ` · Data refreshed ${new Date(lastUpdated).toLocaleString()}` : ""}</p>}
      {!loading && !error && campaigns.length > 0 && <div className="ctCampaignPagination" aria-label="Campaign list pagination">
        <label>Rows per page <select value={pageSize} onChange={event => { setPage(1); setPageSize(Number(event.target.value)); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
        <span aria-live="polite">Page {currentPage} of {pageCount}</span>
        <button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1}>First</button>
        <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={currentPage <= 1}>Previous</button>
        <div className="ctCampaignPageNumbers" role="group" aria-label="Choose campaign page">
          {pageNumbers.map(pageNumber => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === currentPage ? "page" : undefined} aria-label={`Page ${pageNumber}`} disabled={pageNumber === currentPage}>{pageNumber}</button>)}
        </div>
        <button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount}>Next</button>
        <button type="button" onClick={() => setPage(pageCount)} disabled={currentPage >= pageCount}>Last</button>
      </div>}
      {loading ? <div className="ctCampaignEmpty">Loading your campaigns…</div> : error ? <div className="ctCampaignEmpty" role="alert">{error}<p><Link href="/login">Sign in</Link> if you are not already signed in, and confirm your verified member access is configured.</p></div> : campaigns.length === 0 ? <div className="ctCampaignEmpty">You have no saved campaigns yet. <Link href="/advertise">Create your first campaign ↗</Link></div> : filtered.length === 0 ? <div className="ctCampaignEmpty">No campaigns match these filters. Try another search or status. <button type="button" onClick={() => { setPage(1); setSearch(""); setStatusFilter("all"); setScheduleFilter("all"); setMetricsFilter("all"); setBudgetFilter("all"); setReviewFilter("all"); }}>Clear all filters</button></div> : <div className="ctCampaignList">{pageCampaigns.map(campaign => {
        const metricsVerified = campaign.metrics_status === "verified_events";
        const impressions = metricsVerified ? Number(campaign.impressions_count) || 0 : 0;
        const clicks = metricsVerified ? Number(campaign.clicks_count) || 0 : 0;
        const spend = Number(campaign.spend_minor) || 0;
        const cap = Number(campaign.lifetime_cap_minor) || 0;
        const spendPercent = cap > 0 ? spend / cap * 100 : 0;
        const overCap = cap > 0 && spend > cap;
        const campaignCtr = impressions > 0 ? clicks / impressions * 100 : 0;
        return <article className="ctCampaignCard" key={campaign.$id}>
          <div className="ctCampaignTitle"><div><span>{campaign.company || "Advertiser"}</span><h2>{campaign.campaign_name || "Untitled campaign"}</h2></div><b className={campaign.status === "approved" || campaign.status === "active" ? "ctAdStatus positive" : "ctAdStatus"}>{label(campaign.status)}</b></div>
          <div className="ctCampaignMetrics"><div><small>DAILY BUDGET</small><strong>{money(campaign.daily_budget_minor)}</strong></div><div><small>TOTAL SPEND CAP</small><strong>{money(campaign.lifetime_cap_minor)}</strong></div><div><small>RECORDED SPEND</small><strong>{money(campaign.spend_minor)}</strong></div><div><small>VERIFIED IMPRESSIONS</small><strong>{metricsVerified ? number(impressions) : "Not verified"}</strong></div><div><small>VERIFIED CLICKS</small><strong>{metricsVerified ? number(clicks) : "Not verified"}</strong></div><div><small>VERIFIED CTR</small><strong>{metricsVerified ? pct(campaignCtr) : "Not available"}</strong></div></div>
          <div className="ctAdSpendTrack" aria-label={`Spend cap used: ${spendPercent.toFixed(1)} percent${overCap ? ", over cap" : ""}`}><span style={{ width: `${Math.min(100, spendPercent)}%` }} /></div><div className="ctAdSpendCaption"><span>{money(spend)} recorded</span><span>{overCap ? `${money(spend - cap)} over lifetime cap` : cap > 0 ? `${money(cap - spend)} remaining of cap` : "No lifetime cap recorded"}</span></div>{overCap && <p className="ctCampaignOverCap" role="alert">Recorded spend exceeds this campaign’s lifetime cap. Review the account and delivery records.</p>}
          <div className="ctAdAudience"><div><small>OBJECTIVE & PLACEMENT</small><strong>{label(campaign.objective)} · {label(campaign.placement)}</strong></div><div><small>TARGET AUDIENCE</small><strong>{campaign.country || "Country not set"} · {campaign.region || "Region not set"}</strong>{campaign.geo_targets && <span>{campaign.geo_targets}</span>}{campaign.audience_interests && <span>Interests: {campaign.audience_interests.split(",").filter(Boolean).join(" · ")}</span>}</div><div><small>SCHEDULE · {scheduleStatus(campaign, now).toUpperCase()}</small><strong>{date(campaign.starts_at)} – {date(campaign.ends_at)}</strong></div></div>
          <div className="ctCampaignMeta"><span>Campaign ID: <code>{campaign.$id}</code> <button type="button" onClick={() => void copyCampaignId(campaign.$id)} aria-label={`Copy campaign ID ${campaign.$id}`}>{copiedCampaignId === campaign.$id ? "Copied" : "Copy ID"}</button></span><span>AI screen: {label(campaign.moderation_status)}</span><span>Human review: {label(campaign.human_review_status)}</span><span>Payment: {label(campaign.payment_status)}</span><span>Metrics: {campaign.metrics_status === "verified_events" ? "Verified events" : campaign.metrics_status === "temporarily_unavailable" ? "Temporarily unavailable" : "Not active"}</span></div>
        </article>;
      })}</div>}
      <p className="ctAdDashboardFoot">Reporting is calculated from verified event records returned by ConnectTime's campaign API. Estimated reach, demographic predictions, and unverified views are not presented as actual performance.</p>
    </section>
  </main>;
}
