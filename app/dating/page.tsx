"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Profile = { handle: string; displayName: string; bio: string; country: string; region: string; interests: string[]; age: number; gender: string; relationshipGoal: string; matchScore?: number | null; matchReasons?: string[] };
const goalLabels: Record<string, string> = { serious_relationship: "Serious relationship", dating: "Dating", friendship: "Friendship first" };

export default function DatingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [interest, setInterest] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("everyone");
  const [goal, setGoal] = useState("any");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(80);
  const [loading, setLoading] = useState(true);
  const discoveryLoaded = useRef(false);
  const [searching, setSearching] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/dating/likes", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Likes are unavailable.");
        if (active) setLiked(data.sent || []);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Likes are unavailable."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (country.trim()) params.set("country", country.trim());
    if (interest.trim()) params.set("interest", interest.trim());
    const query = params.toString();
    const timer = window.setTimeout(async () => {
      if (!discoveryLoaded.current) setLoading(true);
      else setSearching(true);
      try {
        const response = await fetch("/api/discover/profiles" + (query ? "?" + query : ""), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Dating discovery is unavailable.");
        if (active) { setProfiles(data.profiles || []); setNextCursor(data.nextCursor || null); discoveryLoaded.current = true; setError(""); }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Dating discovery is unavailable.");
      } finally {
        if (active) { setLoading(false); setSearching(false); }
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, country, interest]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles.filter(p => {
      const searchable = [p.displayName, p.handle, p.bio, p.country, p.region, p.gender, goalLabels[p.relationshipGoal] || p.relationshipGoal, ...p.interests].filter(Boolean).join(" ").toLowerCase();
      return p.age >= 18 && !!p.gender && p.age >= minAge && p.age <= maxAge
        && (gender === "everyone" || p.gender === gender)
        && (goal === "any" || p.relationshipGoal === goal)
        && (!country.trim() || p.country.toLowerCase().includes(country.trim().toLowerCase()))
        && (!interest.trim() || p.interests.some(v => v.toLowerCase().includes(interest.trim().toLowerCase())))
        && (!query || searchable.includes(query));
    });
  }, [profiles, minAge, maxAge, gender, goal, country, interest, search]);

  async function loadMoreProfiles() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (country.trim()) params.set("country", country.trim());
      if (interest.trim()) params.set("interest", interest.trim());
      params.set("cursor", nextCursor);
      const response = await fetch("/api/discover/profiles?" + params.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "More profiles could not be loaded.");
      setProfiles(current => [...current, ...(data.profiles || []).filter((profile: Profile) => !current.some(item => item.handle === profile.handle))]);
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "More profiles could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setSearch(""); setInterest(""); setCountry(""); setGender("everyone"); setGoal("any"); setMinAge(18); setMaxAge(80); setSelected([]);
  }

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
    <header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/profile">My profile</Link><Link href="/dating/likes">Likes & matches</Link><Link href="/friends">Friends</Link><Link href="/safety">Safety</Link></nav></header>
    <section className="authCard discoverCard">
      <div className="eyebrow">CONNECT DATING · VERIFIED ADULTS</div>
      <h1>Meet someone who gets you.</h1>
      <p>Discover people by shared interests, age, location and what they are looking for. Send a like to show interest. When you both like each other, it’s a match.</p>
      <div className="datingQuickSearch">
        <label htmlFor="datingPeopleSearch">Find people</label>
        <div className="datingQuickSearchField"><span aria-hidden="true">⌕</span><input id="datingPeopleSearch" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, interests, places or keywords…" autoComplete="off"/>{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}</div>
        <p>Try a name, city, country, hobby or relationship goal.</p>
      </div>
      <details className="datingAdvancedFilters">
        <summary>Refine your search <span>Optional filters</span></summary>
        <div className="discoverFilters">
          <label>Shared interest<input value={interest} onChange={e => setInterest(e.target.value)} placeholder="Music, travel, books…"/></label>
          <label>Country<input value={country} onChange={e => setCountry(e.target.value)} placeholder="Any country"/></label>
          <label>Interested in<select value={gender} onChange={e => setGender(e.target.value)}><option value="everyone">Everyone</option><option value="woman">Women</option><option value="man">Men</option><option value="nonbinary">Non-binary</option></select></label>
          <label>Looking for<select value={goal} onChange={e => setGoal(e.target.value)}><option value="any">Any relationship goal</option><option value="serious_relationship">Serious relationship</option><option value="dating">Dating</option><option value="friendship">Friendship first</option></select></label>
          <label>Minimum age<input type="number" min={18} max={110} value={minAge} onChange={e => setMinAge(Math.min(110, Math.max(18, Number(e.target.value))))}/></label>
          <label>Maximum age<input type="number" min={18} max={110} value={maxAge} onChange={e => setMaxAge(Math.max(minAge, Math.min(110, Number(e.target.value))))}/></label>
        </div>
        <button type="button" className="datingClearFilters" onClick={clearFilters}>Clear all filters</button>
      </details>
      <p className="switch"><Link href="/profile">Complete your dating profile and interests</Link> · <Link href="/friends">Your friends</Link></p>
      {error && <p className="message" role="alert">{error}</p>}{message && <p className="message" role="status">{message}</p>}
      <div className="communityFeedHead"><div><span>YOUR DISCOVERY</span><h2>{results.length} {results.length === 1 ? "person" : "people"} to explore</h2></div><span>{searching ? "Updating results…" : "18+ only"}</span></div>
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
        {typeof profile.matchScore === "number" && <div className="datingMatchFit"><strong>{profile.matchScore}% profile compatibility</strong>{profile.matchReasons?.length ? <span>{profile.matchReasons.join(" · ")}</span> : <span>No shared details found yet. Add interests and a relationship goal to improve recommendations.</span>}</div>}
        <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>
        {!liked.includes(profile.handle) && <label className="datingSelectMember"><input type="checkbox" checked={selected.includes(profile.handle)} onChange={() => toggleSelected(profile.handle)} disabled={bulkSending}/> Select this person</label>}
        <button className="discoverConnectButton" disabled={!!sending || liked.includes(profile.handle)} onClick={() => void like(profile)}>{sending === profile.handle ? "Sending…" : liked.includes(profile.handle) ? "♥ Like sent" : "♡ Send a like"}</button>
      </article>)}</div>
        {nextCursor && <div className="datingLoadMore"><button type="button" onClick={() => void loadMoreProfiles()} disabled={loadingMore || searching}>{loadingMore ? "Loading more people…" : "Load more people"}</button></div>} : <div className="datingNoResults"><strong>No people found for that search.</strong><p>Try a different keyword or remove some filters to see more profiles.</p><button type="button" onClick={clearFilters}>Show everyone</button></div>}
      <p className="switch"><Link href="/safety">Safety Center</Link> · <Link href="/profile">Edit dating profile</Link></p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Meet through shared interests.</footer>
  </main>;
}
