"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdvertisingReportPage() {
  const [form, setForm] = useState({ type: "copyright", adReference: "", workDescription: "", details: "", claimantName: "", claimantEmail: "", goodFaith: false });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/advertising/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      setMessage(response.ok ? `Report received. Reference: ${result.reference}` : result.error || "Unable to submit report.");
      if (response.ok) setForm({ type: "copyright", adReference: "", workDescription: "", details: "", claimantName: "", claimantEmail: "", goodFaith: false });
    } catch { setMessage("Reporting is temporarily unavailable. Please contact ConnectTime support."); }
    finally { setBusy(false); }
  }
  return <main className="adMarketplace"><header className="adTopbar"><Link href="/" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>AD REPORTING</small></span></Link><nav><Link href="/advertise">Advertising</Link><Link href="/">Community</Link></nav></header><section className="adBuilder"><div className="adBuilderIntro"><span className="adEyebrow">TRUST & SAFETY</span><h1>Report an advertisement</h1><p>Report suspected copyright or trademark infringement, prohibited sexual content, misleading claims, or another advertising policy concern. Reports are reviewed by our team.</p></div><form className="adForm" onSubmit={submit}><label>Report category<select value={form.type} onChange={e => update("type",e.target.value)}><option value="copyright">Copyright infringement</option><option value="trademark">Trademark misuse</option><option value="nudity">Nudity / pornography</option><option value="sexual">Sexual or exploitative content</option><option value="misleading">Misleading or deceptive ad</option><option value="other">Other policy violation</option></select></label><label>Ad reference or URL<input required value={form.adReference} onChange={e => update("adReference",e.target.value)} maxLength={160} /></label><label>Describe the original work or rights involved <textarea value={form.workDescription} onChange={e => update("workDescription",e.target.value)} rows={3} maxLength={2000} placeholder="For copyright/trademark reports, identify the original work or mark and your relationship to it." /></label><label>Explain the concern <textarea required value={form.details} onChange={e => update("details",e.target.value)} rows={5} maxLength={4000} /></label><label>Your name<input required value={form.claimantName} onChange={e => update("claimantName",e.target.value)} maxLength={160} /></label><label>Your contact email<input required type="email" value={form.claimantEmail} onChange={e => update("claimantEmail",e.target.value)} maxLength={254} /></label><label><input type="checkbox" checked={form.goodFaith} onChange={e => update("goodFaith",e.target.checked)} /> I have a good-faith belief that the reported use is unauthorized or violates ConnectTime's advertising policy, and the information I provide is accurate.</label><button className="adSaveButton" disabled={busy || !form.goodFaith}>{busy ? "Submitting…" : "Submit report"}</button><p role="status">{message || "Please provide accurate information. False or abusive reports may be rejected."}</p></form></section></main>;
}
