"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Profile = { handle?: string; display_name?: string; bio?: string; country?: string; region?: string; interests?: string; visibility?: string; age?: number; gender?: string; interested_in?: string; relationship_goal?: string };

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
        country: profile.country || "", region: profile.region || "", interests: profile.interests || "", visibility: profile.visibility || "members", age: profile.age ? Number(profile.age) : undefined, gender: profile.gender || "", interestedIn: profile.interested_in || "everyone", relationshipGoal: profile.relationship_goal || "friendship",
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profile could not be saved.");
      setProfile(data.profile); setMessage("Your profile has been saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  }

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/"><img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}>
    <div className="eyebrow">YOUR CONNECTTIME IDENTITY</div><h1>Edit your profile</h1>
    <p>Choose what other members can see. Your precise location and verification documents are never displayed here.</p>
    {loading ? <p role="status">Loading your profile…</p> : error ? <div role="alert" className="message"><p>{error}</p><p>If you are not signed in, log in and return to profile setup. If profile storage is unavailable, try again after the service is configured.</p><p><Link href="/login">Log in</Link> · <Link href="/account">Account overview</Link></p></div> : <>
      <label>Username / handle<input value={profile.handle || ""} onChange={e => update("handle", e.target.value)} placeholder="your_handle" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required/><small>3–24 letters, numbers, or underscores.</small></label>
      <label>Display name<input value={profile.display_name || ""} onChange={e => update("display_name", e.target.value)} maxLength={80} required/></label>
      <label>About you<textarea value={profile.bio || ""} onChange={e => update("bio", e.target.value)} maxLength={500} rows={4}/></label>
      <label>Country<input value={profile.country || ""} onChange={e => update("country", e.target.value)} maxLength={80} required/></label>
      <label>Region / state <span>(optional)</span><input value={profile.region || ""} onChange={e => update("region", e.target.value)} maxLength={100}/></label>
      <label>Interests <span>(comma separated)</span><input value={profile.interests || ""} onChange={e => update("interests", e.target.value)} placeholder="Music, travel, technology" maxLength={384}/></label>

      <div className="eyebrow">DATING PROFILE · 18+ MEMBERS</div>
      <label>Age<input type="number" min={18} max={110} value={profile.age ?? ""} onChange={e => setProfile(current => ({ ...current, age: e.target.value === "" ? undefined : Number(e.target.value) }))}/><small>Your age is shown on your dating card. Your birth date and ID are never displayed.</small></label>
      <label>Gender<select value={profile.gender || ""} onChange={e => update("gender", e.target.value)}><option value="">Choose gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="nonbinary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      <label>Interested in<select value={profile.interested_in || "everyone"} onChange={e => update("interested_in", e.target.value)}><option value="everyone">Everyone</option><option value="women">Women</option><option value="men">Men</option><option value="nonbinary">Non-binary people</option></select></label>
      <label>What are you looking for?<select value={profile.relationship_goal || "friendship"} onChange={e => update("relationship_goal", e.target.value)}><option value="serious_relationship">A serious relationship</option><option value="dating">Dating</option><option value="friendship">Friendship first</option></select></label>
      <label>Profile visibility<select value={profile.visibility || "members"} onChange={e => update("visibility", e.target.value)}><option value="public">Public</option><option value="members">Signed-in members</option><option value="friends">Friends only</option><option value="private">Only me</option></select></label>
      <button className="button" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
    </>}
    {message && <p role="status" className="message">{message}</p>}{error && <p role="alert" className="message">{error}</p>}
    <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/safety">Safety Center</Link></p>
  </form></main>;
}
