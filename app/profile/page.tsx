"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Profile = { handle?: string; display_name?: string; bio?: string; country?: string; region?: string; interests?: string; visibility?: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load profile.");
        const savedProfile = data.profile || {};
        const signupCountry = new URLSearchParams(window.location.search).get("country") || "";
        setProfile({ ...savedProfile, country: savedProfile.country || signupCountry });
      })
      .catch(e => setError(e instanceof Error ? e.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  function update(key: keyof Profile, value: string) { setProfile(current => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        handle: profile.handle || "", displayName: profile.display_name || "", bio: profile.bio || "",
        country: profile.country || "", region: profile.region || "", interests: profile.interests || "", visibility: profile.visibility || "members",
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profile could not be saved.");
      setProfile(data.profile); setMessage("Your profile has been saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  }

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/"><img src="/connecttime-logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}>
    <div className="eyebrow">YOUR CONNECTTIME IDENTITY</div><h1>Edit your profile</h1>
    <p>Choose what other members can see. Your precise location and verification documents are never displayed here.</p>
    {loading ? <p role="status">Loading your profile…</p> : <>
      <label>Username / handle<input value={profile.handle || ""} onChange={e => update("handle", e.target.value)} placeholder="your_handle" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required/><small>3–24 letters, numbers, or underscores.</small></label>
      <label>Display name<input value={profile.display_name || ""} onChange={e => update("display_name", e.target.value)} maxLength={80} required/></label>
      <label>About you<textarea value={profile.bio || ""} onChange={e => update("bio", e.target.value)} maxLength={500} rows={4}/></label>
      <label>Country<input value={profile.country || ""} onChange={e => update("country", e.target.value)} maxLength={80} required/></label>
      <label>Region / state <span>(optional)</span><input value={profile.region || ""} onChange={e => update("region", e.target.value)} maxLength={100}/></label>
      <label>Interests <span>(comma separated)</span><input value={profile.interests || ""} onChange={e => update("interests", e.target.value)} placeholder="Music, travel, technology" maxLength={384}/></label>
      <label>Profile visibility<select value={profile.visibility || "members"} onChange={e => update("visibility", e.target.value)}><option value="public">Public</option><option value="members">Signed-in members</option><option value="friends">Friends only</option><option value="private">Only me</option></select></label>
      <button className="button" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
    </>}
    {message && <p role="status" className="message">{message}</p>}{error && <p role="alert" className="message">{error}</p>}
    <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/safety">Safety Center</Link></p>
  </form></main>;
}
