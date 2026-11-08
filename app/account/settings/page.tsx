"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Preferences = { friend_requests: boolean; friend_acceptances: boolean; private_messages: boolean; dating_likes: boolean; product_updates: boolean };
const defaults: Preferences = { friend_requests: true, friend_acceptances: true, private_messages: true, dating_likes: true, product_updates: false };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const choices: [keyof Preferences, string, string][] = [
    ["friend_requests", "New friend requests", "When another eligible member requests to connect."],
    ["friend_acceptances", "Accepted friend requests", "When a connection request you sent is accepted."],
    ["private_messages", "Private messages", "When a connection sends you a private message."],
    ["dating_likes", "Dating likes and matches", "When someone likes your dating profile or you make a mutual match."],
    ["product_updates", "Connect product updates", "Occasional platform announcements and feature updates."]
  ];

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><section className="authCard settingsCard">
    <div className="eyebrow">ACCOUNT CONTROL</div><h1>Account settings</h1><p>Manage your in-app notification preferences and profile privacy.</p>
    <h2>Notifications</h2>
    {loading ? <p role="status">Loading settings…</p> : <div className="settingsChoices">{choices.map(([key, title, description]) => <label className="settingsChoice" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={settings[key]} onChange={e => setSettings(current => ({ ...current, [key]: e.target.checked }))}/></label>)}</div>}
    <button className="button" onClick={save} disabled={loading || saving || Boolean(error)}>{saving ? "Saving…" : "Save preferences"}</button>
    {message && <p role="status" className="message">{message}</p>}{error && <div role="alert" className="message"><p>{error}</p><p><Link href="/login">Log in</Link> · <Link href="/account">Account overview</Link></p></div>}
    <div className="settingsSection"><h2>Profile privacy</h2><p>Choose who can discover your profile from <Link href="/profile">Edit your profile</Link>. Existing discovery rules only expose public/member profiles; friends-only and private visibility are not listed publicly.</p></div>
    <div className="settingsSection"><h2>Profile photos</h2><p>Photo uploads are not available yet. They will remain disabled until private quarantine storage, moderation checks, and age-safety controls are tested.</p></div>
    <div className="settingsSection"><h2>Account deactivation</h2><p>Self-service deactivation is not enabled yet. Contact Connect support to request account closure; do not assume deleting the app or signing out deactivates your account.</p></div>
    <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/safety">Safety Center</Link></p>
  </section></main>;
}
