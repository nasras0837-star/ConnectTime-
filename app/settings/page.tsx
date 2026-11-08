"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Preferences = { compactFeed: boolean; reduceMotion: boolean; showMediaPreviews: boolean };
const defaults: Preferences = { compactFeed: false, reduceMotion: false, showMediaPreviews: true };
const storageKey = "connecttime-device-preferences-v1";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Preferences>;
        setPreferences({ ...defaults, ...parsed });
      }
    } catch { /* Use safe defaults if device storage is unavailable. */ }
    setReady(true);
  }, []);

  function update(key: keyof Preferences, value: boolean) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice("Saved on this device.");
    } catch {
      setNotice("This browser could not save the preference. It will reset when you leave.");
    }
  }

  function reset() {
    setPreferences(defaults);
    try { window.localStorage.removeItem(storageKey); setNotice("Device preferences reset."); }
    catch { setNotice("Could not clear device preferences."); }
  }

  const rows: { key: keyof Preferences; title: string; description: string }[] = [
    { key: "compactFeed", title: "Compact feed cards", description: "Use a denser layout where supported by the page." },
    { key: "reduceMotion", title: "Prefer reduced motion", description: "A preference for less animation; individual pages may not yet apply it." },
    { key: "showMediaPreviews", title: "Show media previews", description: "Allow preview cards on pages that support this setting." },
  ];

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home"><img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link>
    <section className="authCard" style={{ width: "min(100%, 720px)" }}>
      <div className="eyebrow">MAKE IT YOURS</div><h1>Settings</h1>
      <p>Manage this browser's display preferences and find account, privacy, and security controls.</p>
      <div style={{ display: "grid", gap: 12, margin: "22px 0" }}>
        {rows.map(row => <label key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: 16, border: "1px solid #e5e8f2", borderRadius: 13, cursor: ready ? "pointer" : "wait" }}>
          <span><strong style={{ display: "block" }}>{row.title}</strong><small style={{ color: "#66718a" }}>{row.description}</small></span>
          <input type="checkbox" checked={preferences[row.key]} disabled={!ready} onChange={event => update(row.key, event.target.checked)} aria-label={row.title} style={{ width: 20, height: 20, flexShrink: 0 }}/>
        </label>)}
      </div>
      {notice && <p role="status" className="message">{notice}</p>}
      <button type="button" className="button" onClick={reset} disabled={!ready}>Reset device preferences</button>
      <h2 style={{ marginTop: 28 }}>Account & privacy</h2>
      <div style={{ display: "grid", gap: 10 }}>
        <Link href="/account">Account overview →</Link><Link href="/profile">Edit profile & visibility →</Link><Link href="/safety">Safety Center, blocks & reports →</Link><Link href="/notifications">Activity notifications →</Link><Link href="/legal/privacy">Privacy policy →</Link>
      </div>
      <h2 style={{ marginTop: 28 }}>Security basics</h2><ul><li>Use a unique password and never share recovery links.</li><li>Sign out on shared or public devices.</li><li>Only use official ConnectTime verification flows; never send ID documents in messages.</li><li>Report suspicious requests or safety concerns through the Safety Center.</li></ul>
      <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/">Home</Link></p>
    </section>
  </main>;
}
