"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Report = {
  $id: string;
  reporter_user_id?: string;
  reported_user_id?: string;
  target_type?: string;
  content_reference?: string;
  category?: string;
  details?: string;
  status?: string;
  created_at?: string;
  reviewer_user_id?: string;
  reviewed_at?: string;
  resolution_note?: string;
  action_taken?: string;
};

type Decision = { status: "reviewing" | "resolved" | "dismissed"; action: "none" | "remove_content" | "suspend_member"; resolutionNote: string };

const statuses = ["all", "open", "reviewing", "resolved", "dismissed"] as const;

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<(typeof statuses)[number]>("open");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      const suffix = filter === "all" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/community/moderation${suffix}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The moderation queue is unavailable.");
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The moderation queue is unavailable.");
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  function updateDecision(id: string, patch: Partial<Decision>) {
    setDecisions(current => { const existing = current[id] || { status: "reviewing" as const, action: "none" as const, resolutionNote: "" }; return { ...current, [id]: { ...existing, ...patch } }; });
  }

  async function submitDecision(report: Report) {
    const decision = decisions[report.$id] || { status: "reviewing" as const, action: "none" as const, resolutionNote: "" };
    if (decision.status === "resolved" && !decision.resolutionNote.trim()) {
      setError("Add a resolution note before resolving a report."); return;
    }
    if (decision.action === "remove_content" && report.target_type !== "post") {
      setError("Only reported posts can currently be removed from this dashboard."); return;
    }
    if (decision.action === "suspend_member" && !report.reported_user_id) {
      setError("This report does not identify a reported member, so suspension is unavailable."); return;
    }
    setBusy(report.$id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.$id, ...decision })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The moderation decision was not saved.");
      setNotice("Decision saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The moderation decision was not saved.");
    } finally { setBusy(""); }
  }

  const card: React.CSSProperties = { background: "white", border: "1px solid #e7e5ef", borderRadius: 16, padding: 20, marginTop: 14, boxShadow: "0 8px 24px #24104a0a" };
  const field: React.CSSProperties = { padding: "10px 12px", border: "1px solid #d9d5e7", borderRadius: 9, font: "inherit", maxWidth: "100%", background: "white" };
  const button: React.CSSProperties = { border: 0, borderRadius: 9, padding: "10px 15px", background: "#6538bd", color: "white", fontWeight: 700, cursor: "pointer" };

  return <main className="authShell">
    <header className="plannedFeatureHeader">
      <Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
      <nav><Link href="/">Home</Link><Link href="/safety">Safety Center</Link><Link href="/account">Account</Link></nav>
    </header>
    <section style={{ width: "min(100% - 28px, 1050px)", margin: "0 auto 44px" }}>
      <div className="authCard">
        <div className="eyebrow">CONNECT · TRUST & SAFETY</div>
        <h1>Moderator dashboard</h1>
        <p>Review member-submitted reports carefully and consistently. A report is an allegation, not proof. Record a clear reason for every resolved case.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 }}>
          <label htmlFor="report-filter">Queue</label>
          <select id="report-filter" value={filter} onChange={e => setFilter(e.target.value as (typeof statuses)[number])} style={field}>
            {statuses.map(status => <option key={status} value={status}>{status === "all" ? "All reports" : status[0].toUpperCase() + status.slice(1)}</option>)}
          </select>
          <button type="button" onClick={() => void load()} style={button} disabled={loading}>{loading ? "Refreshing…" : "Refresh queue"}</button>
        </div>
        {error && <p role="alert" style={{ color: "#a52a45", marginTop: 15 }}>{error}</p>}
        {notice && <p role="status" style={{ color: "#167b5a", marginTop: 15 }}>{notice}</p>}
      </div>
      {loading ? <p role="status" style={{ padding: 20 }}>Loading reports…</p> : reports.length === 0 ? <section style={card}><h2>No reports in this queue</h2><p>There are no reports matching this filter, or the reports table has not been configured.</p></section> :
        reports.map(report => {
          const decision = decisions[report.$id] || { status: "reviewing" as const, action: "none" as const, resolutionNote: "" };
          const closed = report.status === "resolved" || report.status === "dismissed";
          return <article key={report.$id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{report.category || "Uncategorized report"}</strong><div style={{ color: "#777", fontSize: 12 }}>Report {report.$id} · {report.created_at ? new Date(report.created_at).toLocaleString() : "Date unavailable"}</div></div>
              <span style={{ alignSelf: "start", borderRadius: 99, background: "#f0edf8", padding: "5px 10px", fontSize: 12, fontWeight: 700 }}>{report.status || "unknown"}</span>
            </div>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, fontSize: 13 }}>
              <div><dt style={{ color: "#777" }}>Target</dt><dd>{report.target_type || "Not specified"}</dd></div>
              <div><dt style={{ color: "#777" }}>Reported member</dt><dd>{report.reported_user_id || "Not provided"}</dd></div>
              <div><dt style={{ color: "#777" }}>Reporter</dt><dd>{report.reporter_user_id || "Not provided"}</dd></div>
              <div><dt style={{ color: "#777" }}>Content reference</dt><dd style={{ overflowWrap: "anywhere" }}>{report.content_reference || "Not provided"}</dd></div>
            </dl>
            <h3>Report details</h3><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{report.details || "No details provided."}</p>
            {closed ? <div style={{ background: "#f7f6fa", borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Decision recorded</strong><p>{report.resolution_note || "No resolution note stored."}</p><small>Reviewer: {report.reviewer_user_id || "Unknown"} · {report.reviewed_at || "Time unavailable"} · Action: {report.action_taken || "none"}</small></div> :
              <div style={{ borderTop: "1px solid #eee", paddingTop: 16, display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>Decision status<select value={decision.status} onChange={e => updateDecision(report.$id, { status: e.target.value as Decision["status"], action: e.target.value === "dismissed" || e.target.value === "reviewing" ? "none" : decision.action })} style={field}><option value="reviewing">Mark as reviewing</option><option value="resolved">Resolve report</option><option value="dismissed">Dismiss report</option></select></label>
                <label style={{ display: "grid", gap: 6 }}>Action<select value={decision.action} disabled={decision.status !== "resolved"} onChange={e => updateDecision(report.$id, { action: e.target.value as Decision["action"] })} style={field}><option value="none">No enforcement action</option><option value="remove_content" disabled={report.target_type !== "post"}>Remove reported post</option><option value="suspend_member" disabled={!report.reported_user_id}>Suspend reported member</option></select></label>
                <label style={{ display: "grid", gap: 6 }}>Resolution note<textarea value={decision.resolutionNote} onChange={e => updateDecision(report.$id, { resolutionNote: e.target.value })} maxLength={1000} rows={3} placeholder="Explain the decision and any action taken." style={{ ...field, resize: "vertical" }} /></label>
                <div><button type="button" style={button} disabled={busy === report.$id} onClick={() => void submitDecision(report)}>{busy === report.$id ? "Saving…" : "Save decision"}</button></div>
              </div>}
          </article>;
        })}
      <p style={{ color: "#777", fontSize: 12, marginTop: 20 }}>Moderator access is verified by the server-side allowlist. Do not share this dashboard URL or moderator credentials. Content removal and suspension require correctly configured Appwrite tables and permissions.</p>
      <p className="switch"><Link href="/safety">← Back to Safety Center</Link></p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Trust & Safety</footer>
  </main>;
}
