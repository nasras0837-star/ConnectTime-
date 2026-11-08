"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function CopyrightPage() {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("Submitting report…");
    const details = [
      "COPYRIGHT / DMCA NOTICE",
      `Claimant name: ${String(data.get("claimantName") || "")}`,
      `Claimant email: ${String(data.get("claimantEmail") || "")}`,
      `Copyrighted work: ${String(data.get("workDescription") || "")}`,
      `Location of original work: ${String(data.get("originalLocation") || "")}`,
      `Basis of authority: ${String(data.get("authority") || "")}`,
      `Good-faith statement: ${data.get("goodFaith") === "on" ? "Confirmed" : "Not confirmed"}`,
      `Accuracy and authority statement: ${data.get("accuracy") === "on" ? "Confirmed" : "Not confirmed"}`,
      `Electronic signature: ${String(data.get("signature") || "")}`,
    ].join("\n");
    try {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "copyright",
          targetType: "other",
          contentReference: String(data.get("contentUrl") || ""),
          details,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The report could not be submitted.");
      setStatus(result.message || "Your report was submitted.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The reporting service is unavailable. Nothing was submitted.");
    }
  }
  const field = { display: "grid", gap: 7, marginTop: 14 } as const;
  const input = { width: "100%", padding: "12px 13px", border: "1px solid #d9dbe7", borderRadius: 9, font: "inherit", background: "white" } as const;
  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
    <div style={{ width: "min(100%, 820px)", padding: "0 14px 40px" }}>
      <header className="authCard">
        <div className="eyebrow">CONNECT · COPYRIGHT & INTELLECTUAL PROPERTY</div>
        <h1>Copyright protection</h1>
        <p>Connect respects intellectual property rights and expects members to share only material they own, created themselves, or are authorized to use.</p>
      </header>
      <section className="authCard" style={{ marginTop: 18 }}>
        <h2>Report suspected copyright infringement</h2>
        <p>Use this form if you are the copyright owner or authorized to act for the owner. Identify the specific material and where it appears on Connect. This form is for copyright claims, not general complaints.</p>
        <form onSubmit={submit}>
          <label style={field}>Your full legal name<input name="claimantName" required maxLength={160} style={input} autoComplete="name" /></label>
          <label style={field}>Email address<input name="claimantEmail" type="email" required maxLength={254} style={input} autoComplete="email" /></label>
          <label style={field}>URL or exact location of the material on Connect<input name="contentUrl" type="url" required maxLength={500} style={input} placeholder="https://…" /></label>
          <label style={field}>Identify and describe the copyrighted work<input name="workDescription" required maxLength={1200} style={input} /></label>
          <label style={field}>Where can we find the original or authorized work? (optional)<input name="originalLocation" maxLength={500} style={input} /></label>
          <label style={field}>Explain your authority to submit this notice<textarea name="authority" required minLength={10} maxLength={1200} rows={3} style={input} /></label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 16 }}><input name="goodFaith" type="checkbox" required /><span>I have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</span></label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12 }}><input name="accuracy" type="checkbox" required /><span>The information in this notice is accurate, and under penalty of perjury, I am the owner or authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</span></label>
          <label style={field}>Electronic signature (type your full legal name)<input name="signature" required maxLength={160} style={input} /></label>
          <button type="submit" style={{ border: 0, borderRadius: 10, padding: "12px 17px", background: "#6958d2", color: "white", fontWeight: 700, cursor: "pointer", marginTop: 18 }}>Submit copyright notice</button>
        </form>
        {status && <p role="status" aria-live="polite">{status}</p>}
      </section>
      <section className="authCard" style={{ marginTop: 18 }}>
        <h2>What happens next</h2>
        <ul>
          <li>Connect will review the notice for completeness and may contact you for clarification.</li>
          <li>Where legally appropriate, Connect may restrict access to or remove identified material and notify the account holder.</li>
          <li>Users may submit a legally valid counter-notification where applicable. Connect may restore material only as permitted by applicable law.</li>
          <li>Knowingly submitting materially false infringement claims may have legal consequences.</li>
        </ul>
        <p>For a notice to be formally processed under the U.S. DMCA, it must satisfy the statutory requirements, including the required identification, contact information, statements, and signature. This form is an intake channel and does not guarantee that a notice is legally sufficient or that action has been taken.</p>
        <p><Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/safety">Safety Center</Link> · <Link href="/">Back to Connect</Link></p>
      </section>
    </div>
  </main>;
}
