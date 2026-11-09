"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Report = { id: string; reporterUserId: string; reportedUserId: string; targetType: string; contentReference: string; category: string; details: string; status: string; createdAt: string };
type Closure = { id: string; userId: string; reason: string; status: string; requestedAt: string };
type Queue = { reports: Report[]; closures: Closure[] };

const panel: React.CSSProperties = { border: "1px solid #315b96", borderRadius: 14, background: "rgba(5,19,57,.94)", padding: 18, marginTop: 16 };
const muted: React.CSSProperties = { color: "#c1d6f5", fontSize: 12, lineHeight: 1.6, overflowWrap: "anywhere" };
const button: React.CSSProperties = { border: "1px solid #5285c7", borderRadius: 8, background: "#0b347c", color: "#fff", padding: "8px 11px", fontSize: 11, fontWeight: 800, cursor: "pointer" };

export default function AdminReviewPage() {
  const [queue, setQueue] = useState<Queue>({ reports: [], closures: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/review", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The review queue could not be loaded.");
      setQueue({ reports: data.reports || [], closures: data.closures || [] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review queue is unavailable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function update(queueName: "report" | "closure", id: string, status: string) {
    const key = queueName + ":" + id;
    setBusy(key);
    setMessage("");
    try {
      const response = await fetch("/api/admin/review", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ queue: queueName, id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The review item was not updated.");
      setMessage("Review status updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review item was not updated.");
    } finally { setBusy(""); }
  }

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
    <section style={{ width: "min(100% - 28px, 1080px)", paddingBottom: 44 }}>
      <header className="authCard">
        <div className="eyebrow">CONNECT · RESTRICTED STAFF AREA</div>
        <h1>Safety review dashboard</h1>
        <p>Review community safety reports and account-closure requests. Status updates are recorded in Appwrite; this dashboard does not automatically suspend, delete, or deactivate member accounts.</p>
        <button type="button" style={button} onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh queues"}</button>
      </header>
      {message && <p role="status" aria-live="polite" style={muted}>{message}</p>}
      <section style={panel}>
        <h2>Community reports ({queue.reports.length})</h2>
        <p style={muted}>Review each report fairly and use the status controls to track its handling. Avoid sharing report details outside authorized staff channels.</p>
        {loading ? <p style={muted}>Loading reports…</p> : queue.reports.length ? queue.reports.map(item => <article key={item.id} style={{ borderTop: "1px solid #315b96", padding: "14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{item.category} · {item.targetType}</strong><span style={muted}>Status: {item.status}</span></div>
          <p style={muted}>Report ID: {item.id}<br/>Reporter: {item.reporterUserId || "Not recorded"}<br/>Reported member: {item.reportedUserId || "Not specified"}<br/>Content reference: {item.contentReference || "Not specified"}<br/>Submitted: {item.createdAt || "Not recorded"}</p>
          <p style={{ ...muted, whiteSpace: "pre-wrap" }}>{item.details}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {(["reviewing", "actioned", "dismissed"] as const).map(status => <button key={status} style={button} disabled={busy === "report:" + item.id || item.status === status} onClick={() => void update("report", item.id, status)}>{busy === "report:" + item.id ? "Saving…" : status === "actioned" ? "Mark actioned" : status[0].toUpperCase() + status.slice(1)}</button>)}
          </div>
        </article>) : <p style={muted}>No reports are currently in this queue.</p>}
      </section>
      <section style={panel}>
        <h2>Account-closure requests ({queue.closures.length})</h2>
        <p style={muted}>Approving a request only updates its review status. Account deactivation, deletion, subscription handling, and retention checks must be completed separately by authorized staff.</p>
        {loading ? <p style={muted}>Loading requests…</p> : queue.closures.length ? queue.closures.map(item => <article key={item.id} style={{ borderTop: "1px solid #315b96", padding: "14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>Request {item.id}</strong><span style={muted}>Status: {item.status}</span></div>
          <p style={muted}>Member: {item.userId}<br/>Requested: {item.requestedAt || "Not recorded"}</p>
          {item.reason && <p style={{ ...muted, whiteSpace: "pre-wrap" }}>Reason: {item.reason}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {(["approved", "rejected", "processed"] as const).map(status => <button key={status} style={button} disabled={busy === "closure:" + item.id || item.status === status} onClick={() => void update("closure", item.id, status)}>{busy === "closure:" + item.id ? "Saving…" : status[0].toUpperCase() + status.slice(1)}</button>)}
          </div>
        </article>) : <p style={muted}>No account-closure requests are currently in this queue.</p>}
      </section>
      <p style={{ ...muted, marginTop: 18 }}>Staff access is controlled server-side by the CONNECT_ADMIN_USER_IDS environment variable. Configure only trusted Appwrite user IDs. This dashboard is not a substitute for a documented moderation policy, staff training, or audit logging.</p>
      <p className="switch"><Link href="/">← Back to Connect</Link></p>
    </section>
  </main>;
}
