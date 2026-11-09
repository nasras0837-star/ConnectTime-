"use client";

import Link from "next/link";
import MfaPanel from "./mfa-panel";
import { useEffect, useState } from "react";

type Preferences = { friend_requests: boolean; friend_acceptances: boolean; private_messages: boolean; dating_likes: boolean; product_updates: boolean };
const defaults: Preferences = { friend_requests: true, friend_acceptances: true, private_messages: true, dating_likes: true, product_updates: false };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [closureConfirmed, setClosureConfirmed] = useState(false);
  const [closureBusy, setClosureBusy] = useState(false);
  const [closureStatus, setClosureStatus] = useState("");

  useEffect(() => {
    fetch("/api/account/settings", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Settings could not be loaded.");
      setSettings({ ...defaults, ...data.settings });
    }).catch(e => setError(e instanceof Error ? e.message : "Settings could not be loaded.")).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/account/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Settings could not be saved.");
      setMessage("Your notification preferences have been saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Settings could not be saved."); }
    finally { setSaving(false); }
  }

  async function requestClosure() {
    if (!closureConfirmed) return;
    setClosureBusy(true); setClosureStatus("");
    try {
      const response = await fetch("/api/account/closure-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: closureConfirmed, reason: closureReason }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your closure request could not be submitted.");
      setClosureStatus(data.message || "Your request was submitted for review.");
      setClosureReason(""); setClosureConfirmed(false);
    } catch (e) { setClosureStatus(e instanceof Error ? e.message : "The closure service is unavailable. No request was submitted."); }
    finally { setClosureBusy(false); }
  }

  const choices: [keyof Preferences, string, string][] = [
    ["friend_requests", "New friend requests", "When another eligible member requests to connect."],
    ["friend_acceptances", "Accepted friend requests", "When a connection request you sent is accepted."],
    ["private_messages", "Private messages", "When a connection sends you a private message."],
    ["dating_likes", "Dating likes and matches", "When someone likes your dating profile or you make a mutual match."],
    ["product_updates", "Connect product updates", "Occasional platform announcements and feature updates."]
  ];

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><section className="authCard settingsCard">
    <div className="eyebrow">ACCOUNT CONTROL</div><h1>Account settings</h1><p>Manage your in-app notification preferences and profile privacy.</p>
    <MfaPanel />
    <h2>Notifications</h2>
    {loading ? <p role="status">Loading settings…</p> : <div className="settingsChoices">{choices.map(([key, title, description]) => <label className="settingsChoice" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={settings[key]} onChange={e => setSettings(current => ({ ...current, [key]: e.target.checked }))}/></label>)}</div>}
    <button className="button" onClick={save} disabled={loading || saving || Boolean(error)}>{saving ? "Saving…" : "Save preferences"}</button>
    {message && <p role="status" className="message">{message}</p>}{error && <div role="alert" className="message"><p>{error}</p><p><Link href="/login">Log in</Link> · <Link href="/account">Account overview</Link></p></div>}
    <div className="settingsSection"><h2>Profile privacy</h2><p>Choose who can discover your profile from <Link href="/profile">Edit your profile</Link>. Public and members-only profiles can be discovered by eligible members. Friends-only profiles are restricted to accepted connections, and private profiles are hidden from other members.</p></div>
    <div className="settingsSection"><h2>Profile photos</h2><p>Photo uploads are not available yet. They will remain disabled until private quarantine storage, moderation checks, and age-safety controls are tested.</p></div>
    <div className="settingsSection"><h2>Request account closure</h2><p>Submit a closure request for review. This does not immediately deactivate or delete your account. You can continue signing in until Connect confirms the request has been processed. Do not submit this form for an urgent safety issue.</p><label style={{ display: "grid", gap: 7, marginTop: 12 }}>Reason (optional)<textarea value={closureReason} onChange={event => setClosureReason(event.target.value)} maxLength={500} rows={3} placeholder="Tell us why you are requesting account closure." /></label><label style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 12 }}><input type="checkbox" checked={closureConfirmed} onChange={event => setClosureConfirmed(event.target.checked)} /><span>I confirm that I am requesting account closure and understand this request will be reviewed before any account action is taken.</span></label><button className="button" type="button" onClick={requestClosure} disabled={!closureConfirmed || closureBusy}>{closureBusy ? "Submitting request…" : "Submit closure request"}</button>{closureStatus && <p role="status" className="message">{closureStatus}</p>}</div>
    <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/safety">Safety Center</Link></p>
  </section></main>;
}
