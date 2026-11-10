"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type BlockRow = { $id: string; blocked_user_id: string; created_at?: string };

export default function SafetyCenterPage() {
  const [reportStatus, setReportStatus] = useState("");
  const [appealStatus, setAppealStatus] = useState("");
  const [appeals, setAppeals] = useState<Array<{id:string;status:string;createdAt:string;reference:string}>>([]);
  const [appealsStatus, setAppealsStatus] = useState("");
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [blockStatus, setBlockStatus] = useState("");
  const [blocked, setBlocked] = useState<BlockRow[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  async function loadBlocks() {
    setLoadingBlocks(true);
    try {
      const response = await fetch("/api/community/blocks", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your block list.");
      setBlocked(data.blocks || []);
    } catch (error) {
      setBlockStatus(error instanceof Error ? error.message : "Block list unavailable.");
    } finally { setLoadingBlocks(false); }
  }


  async function submit(event: FormEvent<HTMLFormElement>, endpoint: string, setStatus: (value: string) => void) {
    event.preventDefault();
    setStatus("Submitting…");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed.");
      setStatus(data.message || "Submitted successfully.");
      formElement.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The service is unavailable. Nothing was submitted.");
    }
  }


  async function loadAppeals() {
    setLoadingAppeals(true);
    try {
      const response = await fetch("/api/community/appeals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your appeals.");
      setAppeals(data.appeals || []);
      setAppealsStatus("");
    } catch (error) { setAppealsStatus(error instanceof Error ? error.message : "Appeals unavailable."); }
    finally { setLoadingAppeals(false); }
  }

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBlockStatus("Blocking…");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/community/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedUserId: form.get("blockedUserId") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not block this member.");
      setBlockStatus(data.alreadyBlocked ? "This member was already blocked." : "Member blocked.");
      formElement.reset();
      await loadBlocks();
    } catch (error) {
      setBlockStatus(error instanceof Error ? error.message : "Block service unavailable. The member was not blocked.");
    }
  }

  async function removeBlock(blockedUserId: string) {
    setBlockStatus("Unblocking…");
    try {
      const response = await fetch("/api/community/blocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedUserId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not unblock this member.");
      setBlockStatus("Member unblocked.");
      await loadBlocks();
    } catch (error) {
      setBlockStatus(error instanceof Error ? error.message : "Unblock service unavailable.");
    }
  }

  const fieldStyle = { display: "grid", gap: 7, marginTop: 14 } as const;
  const inputStyle = { width: "100%", padding: "12px 13px", border: "1px solid #d9dbe7", borderRadius: 9, font: "inherit", background: "white" } as const;
  const buttonStyle = { border: 0, borderRadius: 10, padding: "12px 17px", background: "#6958d2", color: "white", fontWeight: 700, cursor: "pointer", marginTop: 15 } as const;
  const cardStyle = { background: "white", border: "1px solid #e9eaf1", borderRadius: 15, padding: 22, marginTop: 18 } as const;

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
    <div style={{ width: "min(100%, 820px)", padding: "0 14px 40px" }}>
      <header className="authCard">
        <div className="eyebrow">CONNECT · MEMBER SAFETY</div>
        <h1>Safety Center</h1>
        <p><Link href="/notifications">View notifications →</Link></p>
        <p>Speak freely and disagree openly. Harassment, intimidation, threats, stalking, and privacy violations are not acceptable.</p>
        <p><Link href="/community-guidelines">Read the Community Guidelines →</Link></p>
      </header>

      <section style={cardStyle}>
        <h2>Report a member or content</h2>
        <p>Use this form for harassment, intimidation, threats, hate, privacy violations, sexual content, spam, or other safety concerns. Provide enough context for a fair review.</p>
        <form onSubmit={event => submit(event, "/api/community/reports", setReportStatus)}>
          <label style={fieldStyle}>Report category<select name="category" required style={inputStyle}><option value="">Choose a reason</option><option value="harassment">Harassment or bullying</option><option value="intimidation">Intimidation or stalking</option><option value="threats">Threats or encouragement of violence</option><option value="hate">Hateful or dehumanizing attack</option><option value="privacy">Privacy violation or doxxing</option><option value="sexual-content">Non-consensual or prohibited sexual content</option><option value="spam">Spam or scams</option><option value="other">Other safety concern</option></select></label>
          <label style={fieldStyle}>What are you reporting?<select name="targetType" required style={inputStyle}><option value="member">A member</option><option value="post">A post</option><option value="message">A message</option><option value="other">Other</option></select></label>
          <label style={fieldStyle}>Reported member&apos;s user ID (if applicable)<input name="targetUserId" maxLength={128} style={inputStyle} placeholder="Member ID" /></label>
          <label style={fieldStyle}>Content reference or link (if applicable)<input name="contentReference" maxLength={180} style={inputStyle} placeholder="Post or message reference" /></label>
          <label style={fieldStyle}>What happened?<textarea name="details" required minLength={10} maxLength={3000} rows={5} style={inputStyle} placeholder="Describe what happened, including relevant context." /></label>
          <button style={buttonStyle} type="submit">Submit report</button>
        </form>
        {reportStatus && <p role="status" aria-live="polite">{reportStatus}</p>}
      </section>

      <section style={cardStyle}>
        <h2>Block a member</h2>
        <p>Blocking is personal: it records your choice to block that account. Connect must also enforce block relationships in messaging, profile discovery, and content interactions before those features launch.</p>
        <form onSubmit={addBlock}>
          <label style={fieldStyle}>Member user ID<input name="blockedUserId" required maxLength={128} style={inputStyle} placeholder="Enter the member&apos;s user ID" /></label>
          <button style={buttonStyle} type="submit">Block member</button>
        </form>
        {blockStatus && <p role="status" aria-live="polite">{blockStatus}</p>}
        <h3 style={{ marginTop: 25 }}>Your blocked members</h3>
        <button type="button" onClick={() => void loadBlocks()} style={{ ...buttonStyle, marginTop: 4, background: "#eeeaf9", color: "#51419b" }}>{loadingBlocks ? "Refreshing…" : "Refresh block list"}</button>
        {blocked.length ? <ul>{blocked.map(item => <li key={item.$id} style={{ marginTop: 10 }}>{item.blocked_user_id} <button type="button" onClick={() => void removeBlock(item.blocked_user_id)} style={{ marginLeft: 12 }}>Unblock</button></li>)}</ul> : <p>{loadingBlocks ? "Loading…" : "No blocked members are listed, or the block service is not configured."}</p>}
      </section>

      <section style={cardStyle}>
        <h2>Appeal a moderation decision</h2>
        <p>If you believe a warning, restriction, or suspension was applied in error, explain why. Submitting an appeal does not automatically reverse the decision.</p>
        <form onSubmit={event => submit(event, "/api/community/appeals", setAppealStatus)}>
          <label style={fieldStyle}>Moderation notice or enforcement reference<input name="enforcementReference" required maxLength={180} style={inputStyle} placeholder="Reference shown in your notice" /></label>
          <label style={fieldStyle}>Reason for appeal<select name="reason" required style={inputStyle}><option value="">Choose a reason</option><option value="mistaken-identity">Mistaken identity</option><option value="context-missing">Important context was missing</option><option value="content-not-violation">The content did not violate the rules</option><option value="other">Other</option></select></label>
          <label style={fieldStyle}>Explain your appeal<textarea name="details" required minLength={20} maxLength={3000} rows={5} style={inputStyle} placeholder="Explain the decision you are appealing and the context you want reviewed." /></label>
          <button style={buttonStyle} type="submit">Submit appeal</button>
        </form>
        {appealStatus && <p role="status" aria-live="polite">{appealStatus}</p>}
      </section>
      <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6, marginTop: 18 }}>Reports and appeals are private submissions. Do not use these forms for emergencies. If someone is in immediate danger, contact local emergency services. The tools display an error rather than claim success when server storage is not configured.</p>
      <p className="switch"><Link href="/">← Back to Connect</Link></p>
    </div>
  </main>;
}
