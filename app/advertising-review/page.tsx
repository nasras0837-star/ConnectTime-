"use client";

import { useState } from "react";
import Link from "next/link";

type ReviewItem = Record<string, unknown> & { $id: string; status?: string; type?: string; company?: string; campaign?: string; adReference?: string; details?: string; headline?: string; body?: string; claimantName?: string; claimantEmail?: string; createdAt?: string };

export default function AdvertisingReviewPage() {
  const [token, setToken] = useState("");
  const [ads, setAds] = useState<ReviewItem[]>([]);
  const [complaints, setComplaints] = useState<ReviewItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadQueue() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/advertising/review-queue", { headers: { Authorization: "Bearer " + token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load review queue.");
      setAds(data.ads || []); setComplaints(data.complaints || []);
      setMessage("Review queue loaded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load review queue."); }
    finally { setBusy(false); }
  }

  async function update(kind: "ad" | "complaint", id: string, action: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/advertising/review-queue", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ kind, id, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update review item.");
      setMessage("Review item updated: " + action + ".");
      await loadQueue();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update review item."); }
    finally { setBusy(false); }
  }

  const field = (item: ReviewItem, key: string) => typeof item[key] === "string" ? String(item[key]) : "";
  return <main className="adMarketplace"><header className="adTopbar"><Link href="/" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>AD REVIEW</small></span></Link><nav><Link href="/advertise">Advertising</Link><Link href="/advertising-report">Reports</Link><Link href="/">Community</Link></nav></header><section className="adBuilder"><div className="adBuilderIntro"><span className="adEyebrow">RESTRICTED STAFF TOOL</span><h1>Advertising review queue</h1><p>Review AI-screened campaign submissions and intellectual-property / policy complaints. Approval is a human decision. Do not approve an ad unless the creative, advertiser, rights, and claims have been checked.</p></div><section className="adFormSection"><label>Staff review access token<input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Enter AD_REVIEW_ADMIN_TOKEN" /></label><button className="adSaveButton" disabled={busy || !token} onClick={loadQueue}>{busy ? "Loading…" : "Load review queue"}</button><p role="status">{message}</p></section><h2>Campaign submissions ({ads.length})</h2>{ads.length === 0 ? <p>No campaign records returned. Confirm Appwrite configuration.</p> : ads.map(item => <article className="adFormSection" key={item.$id}><h3>{field(item,"campaign") || "Campaign"} · {field(item,"company")}</h3><p>{field(item,"headline")}</p><p>{field(item,"body")}</p><p>AI status: {field(item,"status") || "not recorded"} · Reference: {item.$id}</p><div className="adFormatGrid"><button className="adSaveButton" disabled={busy} onClick={() => update("ad",item.$id,"approved")}>Approve (human review complete)</button><button className="adSaveButton" disabled={busy} onClick={() => update("ad",item.$id,"rejected")}>Reject</button><button className="adSaveButton" disabled={busy} onClick={() => update("ad",item.$id,"paused")}>Pause</button><button className="adSaveButton" disabled={busy} onClick={() => update("ad",item.$id,"takedown")}>Takedown</button></div></article>)}<h2>Copyright and safety complaints ({complaints.length})</h2>{complaints.length === 0 ? <p>No complaints returned.</p> : complaints.map(item => <article className="adFormSection" key={item.$id}><h3>{field(item,"type")} · {field(item,"adReference")}</h3><p>{field(item,"details")}</p><p>Reporter: {field(item,"claimantName")} · {field(item,"claimantEmail")}</p><p>Status: {field(item,"status")} · Reference: {item.$id}</p><div className="adFormatGrid"><button className="adSaveButton" disabled={busy} onClick={() => update("complaint",item.$id,"under_review")}>Under review</button><button className="adSaveButton" disabled={busy} onClick={() => update("complaint",item.$id,"takedown_requested")}>Restrict ad / takedown requested</button><button className="adSaveButton" disabled={busy} onClick={() => update("complaint",item.$id,"resolved")}>Resolve</button><button className="adSaveButton" disabled={busy} onClick={() => update("complaint",item.$id,"dismissed")}>Dismiss</button></div></article>)}</section></main>;
}
