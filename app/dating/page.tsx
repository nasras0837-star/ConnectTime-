"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Profile = { handle: string; displayName: string; bio: string; country: string; region: string; interests: string[]; age: number; gender: string; relationshipGoal: string };
const goalLabels: Record<string, string> = { serious_relationship: "Serious relationship", dating: "Dating", friendship: "Friendship first" };

export default function DatingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [interest, setInterest] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("everyone");
  const [goal, setGoal] = useState("any");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(80);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/discover/profiles", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Dating discovery is unavailable."); return d.profiles || []; }),
      fetch("/api/dating/likes", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Likes are unavailable."); return d.sent || []; })
    ]).then(([items, sent]) => { if (active) { setProfiles(items); setLiked(sent); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Dating is unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => profiles.filter(p => p.age >= 18 && !!p.gender && p.age >= minAge && p.age <= maxAge
    && (gender === "everyone" || p.gender === gender)
    && (goal === "any" || p.relationshipGoal === goal)
    && (!country.trim() || p.country.toLowerCase().includes(country.trim().toLowerCase()))
    && (!interest.trim() || p.interests.some(v => v.toLowerCase().includes(interest.trim().toLowerCase())))), [profiles, minAge, maxAge, gender, goal, country, interest]);

  async function like(profile: Profile) {
    setSending(profile.handle); setMessage(""); setError("");
    try {
      const response = await fetch("/api/dating/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: profile.handle }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send like.");
      setLiked(current => current.includes(profile.handle) ? current : [...current, profile.handle]);
      setSelected(current => current.filter(handle => handle !== profile.handle));
      setMessage(data.matched ? "It's a match with " + profile.displayName + "!" : "Like sent to " + profile.displayName + ".");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send like."); }
    finally { setSending(""); }
  }

  function toggleSelected(handle: string) {
    setSelected(current => current.includes(handle) ? current.filter(item => item !== handle) : [...current, handle]);
  }

  function selectAllMatching() {
    setSelected(results.filter(profile => !liked.includes(profile.handle)).map(profile => profile.handle));
    setMessage("");
  }

  async function likeSelected() {
    const targets = results.filter(profile => selected.includes(profile.handle) && !liked.includes(profile.handle));
    if (!targets.length) return;
    setBulkSending(true); setMessage(""); setError("");
    let sent = 0; let matches = 0; const failed: string[] = [];
    for (const profile of targets) {
      try {
        const response = await fetch("/api/dating/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: profile.handle }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not send like.");
        sent++; if (data.matched) matches++;
        setLiked(current => current.includes(profile.handle) ? current : [...current, profile.handle]);
      } catch { failed.push(profile.displayName); }
    }
    setSelected(current => current.filter(handle => !targets.some(profile => profile.handle === handle)));
    setMessage(sent + " like(s) sent" + (matches ? " · " + matches + " mutual match(es)!" : "") + (failed.length ? " · " + failed.length + " could not be sent" : ""));
    if (failed.length) setError("Please retry for: " + failed.join(", ") + ".");
    setBulkSending(false);
  }

  return <main className="authShell">
    <header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/profile">My profile</Link><Link href="/dating/likes">Likes & matches</Link><Link href="/friends">Friends</Link><Link href="/safety">Safety</Link></nav></header>
    <section className="authCard discoverCard">
      <div className="eyebrow">CONNECTTIME DATING · VERIFIED ADULTS</div>
      <h1>Meet someone who gets you.</h1>
      <p>Discover people by shared interests, age, location and what they are looking for. Send a like to show interest. When you both like each other, it’s a match.</p>
      <div className="discoverFilters">
        <label>Shared interest<input value={interest} onChange={e => setInterest(e.target.value)} placeholder="Music, travel, books…"/></label>
        <label>Country<input value={country} onChange={e => setCountry(e.target.value)} placeholder="Any country"/></label>
        <label>Interested in<select value={gender} onChange={e => setGender(e.target.value)}><option value="everyone">Everyone</option><option value="woman">Women</option><option value="man">Men</option><option value="nonbinary">Non-binary</option></select></label>
        <label>Looking for<select value={goal} onChange={e => setGoal(e.target.value)}><option value="any">Any relationship goal</option><option value="serious_relationship">Serious relationship</option><option value="dating">Dating</option><option value="friendship">Friendship first</option></select></label>
        <label>Minimum age<input type="number" min={18} max={110} value={minAge} onChange={e => setMinAge(Math.min(110, Math.max(18, Number(e.target.value))))}/></label>
        <label>Maximum age<input type="number" min={18} max={110} value={maxAge} onChange={e => setMaxAge(Math.max(minAge, Math.min(110, Number(e.target.value))))}/></label>
      </div>
      <p className="switch"><Link href="/profile">Complete your dating profile and interests</Link> · <Link href="/friends">Your friends</Link></p>
      {error && <p className="message" role="alert">{error}</p>}{message && <p className="message" role="status">{message}</p>}
      <div className="communityFeedHead"><div><span>YOUR DISCOVERY</span><h2>{results.length} potential connections</h2></div><span>18+ only</span></div>
      {!loading && results.length > 0 && <div className="datingSelectionBar">
        <span>{selected.filter(handle => results.some(profile => profile.handle === handle)).length} selected</span>
        <button type="button" onClick={selectAllMatching} disabled={bulkSending}>Select all matching</button>
        <button type="button" onClick={() => setSelected([])} disabled={bulkSending || selected.length === 0}>Clear selection</button>
        <button type="button" className="discoverConnectButton" onClick={() => void likeSelected()} disabled={bulkSending || selected.length === 0}>{bulkSending ? "Sending likes…" : "♡ Send likes (" + selected.filter(handle => results.some(profile => profile.handle === handle) && !liked.includes(handle)).length + ")"}</button>
      </div>}
      {loading ? <p role="status">Finding people…</p> : results.length ? <div className="discoverGrid">{results.map(profile => <article className="discoverMember" key={profile.handle}>
        <div className="discoverAvatar" aria-hidden="true">{profile.displayName.slice(0,1).toUpperCase()}</div>
        <h2>{profile.displayName}, {profile.age}</h2><p className="discoverHandle">@{profile.handle}</p>
        <p>{profile.bio || "Ready to meet new people."}</p><p className="discoverLocation">{[profile.region, profile.country].filter(Boolean).join(", ")}</p>
        <p><strong>{goalLabels[profile.relationshipGoal] || "Open to meeting"}</strong></p>
        <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>
        {!liked.includes(profile.handle) && <label className="datingSelectMember"><input type="checkbox" checked={selected.includes(profile.handle)} onChange={() => toggleSelected(profile.handle)} disabled={bulkSending}/> Select this person</label>}
        <button className="discoverConnectButton" disabled={!!sending || liked.includes(profile.handle)} onClick={() => void like(profile)}>{sending === profile.handle ? "Sending…" : liked.includes(profile.handle) ? "♥ Like sent" : "♡ Send a like"}</button>
      </article>)}</div> : <p>No dating profiles match these filters yet. Try widening your age range or changing your interests.</p>}
      <p className="switch"><Link href="/safety">Safety Center</Link> · <Link href="/profile">Edit dating profile</Link></p>
    </section>
    <footer className="plannedFeatureFooter">ConnectTime · Meet through shared interests.</footer>
  </main>;
}
