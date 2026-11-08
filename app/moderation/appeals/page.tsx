"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Appeal = { $id: string; appellant_user_id?: string; enforcement_reference?: string; reason?: string; details?: string; status?: string; created_at?: string; reviewer_user_id?: string; reviewed_at?: string; review_note?: string };
type Review = { status: "reviewing" | "upheld" | "overturned" | "dismissed"; reviewNote: string };

export default function AppealsReviewPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filter, setFilter] = useState("received");
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");\n  const [restoreNotes,setRestoreNotes]=useState<Record<string,string>>({});\n  const [restoreAction,setRestoreAction]=useState<Record<string,"reinstate_member"|"restore_content">>({});

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/moderation/appeals" + (filter === "all" ? "" : "?status=" + filter), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Appeals queue unavailable.");
      setAppeals(data.appeals || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Appeals queue unavailable."); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  function change(id: string, patch: Partial<Review>) {
    setReviews(old => ({ ...old, [id]: { status: "reviewing", reviewNote: "", ...old[id], ...patch } }));
  }
  async function save(appeal: Appeal) {
    const review = reviews[appeal.$id] || { status: "reviewing" as const, reviewNote: "" };
    if (review.status !== "reviewing" && review.reviewNote.trim().length < 10) { setError("A final decision needs at least 10 characters of notes."); return; }
    setBusy(appeal.$id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/moderation/appeals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appealId: appeal.$id, ...review }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Appeal review was not saved.");
      setNotice("Appeal review saved."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Appeal review was not saved."); }
    finally { setBusy(""); }
  }


  async function restore(appeal:Appeal) {
    const action=restoreAction[appeal.$id]||"reinstate_member";const note=(restoreNotes[appeal.$id]||"").trim();
    if(note.length<20){setError("Restoration needs at least 20 characters explaining the action.");return;}
    if(!window.confirm("Confirm this explicit restoration action? Verify no other enforcement applies first."))return;
    setBusy(appeal.$id);setError("");setNotice("");
    try{const response=await fetch("/api/community/moderation/appeals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({appealId:appeal.$id,restore:action,note})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Restoration failed.");setNotice("Restoration action completed and audited.");await load();}
    catch(e){setError(e instanceof Error?e.message:"Restoration failed.");}finally{setBusy("");}
  }
\n  const card: React.CSSProperties = { background: "white", border: "1px solid #e7e5ef", borderRadius: 15, padding: 20, marginTop: 14 };
  const field: React.CSSProperties = { padding: "10px 12px", border: "1px solid #d9d5e7", borderRadius: 9, font: "inherit", background: "white" };
  const button: React.CSSProperties = { border: 0, borderRadius: 9, padding: "10px 15px", background: "#6538bd", color: "white", fontWeight: 700, cursor: "pointer" };
  return <main className="authShell">
    <header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/moderation">Reports</Link><Link href="/moderation/appeals">Appeals</Link><Link href="/moderation/audit">Audit log</Link><Link href="/safety">Safety Center</Link><Link href="/">Home</Link></nav></header>
    <section style={{ width: "min(100% - 28px, 1000px)", margin: "0 auto 45px" }}>
      <div className="authCard"><div className="eyebrow">CONNECT · TRUST & SAFETY</div><h1>Appeal reviews</h1><p>Review appeals independently and record a reasoned decision. An appeal does not automatically reverse enforcement.</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><label htmlFor="appeal-filter">Queue</label><select id="appeal-filter" value={filter} onChange={e => setFilter(e.target.value)} style={field}>{["received","reviewing","upheld","overturned","dismissed","all"].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select><button style={button} onClick={()=>void load()} disabled={loading}>{loading?"Refreshing…":"Refresh"}</button></div>
        {error&&<p role="alert" style={{color:"#a52a45"}}>{error}</p>}{notice&&<p role="status" style={{color:"#167b5a"}}>{notice}</p>}
      </div>
      {loading?<p role="status">Loading appeals…</p>:appeals.length===0?<section style={card}><p>No appeals in this queue.</p></section>:appeals.map(a=>{
        const closed=["upheld","overturned","dismissed"].includes(a.status||"");
        const r=reviews[a.$id]||{status:"reviewing" as const,reviewNote:""};
        return <article key={a.$id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><strong>Appeal {a.$id}</strong><span>{a.status}</span></div>
          <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,fontSize:13}}><div><dt>Appellant</dt><dd>{a.appellant_user_id||"Unknown"}</dd></div><div><dt>Enforcement reference</dt><dd>{a.enforcement_reference||"Not provided"}</dd></div><div><dt>Reason</dt><dd>{a.reason||"Not specified"}</dd></div><div><dt>Submitted</dt><dd>{a.created_at?new Date(a.created_at).toLocaleString():"Unknown"}</dd></div></dl>
          <h3>Appeal statement</h3><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{a.details||"No statement."}</p>
          {closed?<div style={{background:"#f7f6fa",padding:12,borderRadius:10}}><strong>Final review</strong><p>{a.review_note||"No review note stored."}</p><small>{a.reviewer_user_id||"Unknown reviewer"} · {a.reviewed_at||"Unknown date"}</small></div>{a.status==="overturned"&&<div style={{display:"grid",gap:10,marginTop:12,borderTop:"1px solid #eee",paddingTop:14}}><strong>Explicit restoration (separate from appeal outcome)</strong><label style={{display:"grid",gap:6}}>Restoration action<select style={field} value={restoreAction[a.$id]||"reinstate_member"} onChange={e=>setRestoreAction(old=>({...old,[a.$id]:e.target.value as "reinstate_member"|"restore_content"}))}><option value="reinstate_member">Reinstate suspended member</option><option value="restore_content">Restore removed post</option></select></label><label style={{display:"grid",gap:6}}>Restoration justification<textarea style={{...field,resize:"vertical"}} rows={3} value={restoreNotes[a.$id]||""} onChange={e=>setRestoreNotes(old=>({...old,[a.$id]:e.target.value}))} placeholder="Confirm review of other restrictions and original state; explain why restoration is appropriate."/></label><button style={button} disabled={busy===a.$id} onClick={()=>void restore(a)}>{busy===a.$id?"Processing…":"Execute restoration"}</button><small>Only the action matching the original report is accepted. This does not clear unrelated restrictions.</small></div>}:<div style={{display:"grid",gap:12,borderTop:"1px solid #eee",paddingTop:15}}>
            <label style={{display:"grid",gap:6}}>Decision<select style={field} value={r.status} onChange={e=>change(a.$id,{status:e.target.value as Review["status"]})}><option value="reviewing">Continue reviewing</option><option value="upheld">Uphold original action</option><option value="overturned">Overturn original action</option><option value="dismissed">Dismiss appeal</option></select></label>
            <label style={{display:"grid",gap:6}}>Review note<textarea rows={4} maxLength={1000} value={r.reviewNote} onChange={e=>change(a.$id,{reviewNote:e.target.value})} style={{...field,resize:"vertical"}} placeholder="Explain the outcome and any follow-up needed."/></label>
            <div><button style={button} disabled={busy===a.$id} onClick={()=>void save(a)}>{busy===a.$id?"Saving…":"Save appeal decision"}</button></div>
          </div>}
        </article>
      })}
      <p style={{fontSize:12,color:"#777",marginTop:20}}>This review tool records appeal outcomes only. Restoration is a separate, moderator-confirmed operation after an overturned appeal; verify independent enforcement before reinstating. Each restoration is audited.</p>
    </section><footer className="plannedFeatureFooter">Connect · Trust & Safety</footer>
  </main>;
}
