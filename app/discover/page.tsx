"use client";

import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { useEffect, useState } from "react";

type MemberProfile = { handle: string; displayName: string; bio: string; country: string; region: string; interests: string[] };

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  async function sendRequest(handle: string) {
    setSending(handle); setError(""); setRequestMessage("");
    try {
      const response = await fetch("/api/friends/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: handle }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request could not be sent.");
      setRequestMessage(result.alreadyPending ? "A request is already pending." : "Friend request sent.");
    } catch (e) { setError(e instanceof Error ? e.message : "Request could not be sent."); }
    finally { setSending(""); }
  }

  async function loadProfiles() {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (country.trim()) params.set("country", country.trim());
      if (interest.trim()) params.set("interest", interest.trim());
      const response = await fetch(`/api/discover/profiles?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Member discovery is unavailable.");
      setProfiles(data.profiles || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Member discovery is unavailable."); setProfiles([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discover/profiles", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Member discovery is unavailable.");
        if (!cancelled) setProfiles(data.profiles || []);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Member discovery is unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <main className="connectFeatureShell"><ConnectSiteHeader />
    <section className="authCard discoverCard"><div className="eyebrow">CONNECT · FIND YOUR COMMUNITY</div><h1>Discover members</h1><p>Explore profiles shared by verified adult members. People who have blocked you or whom you have blocked are hidden.</p>
      <form className="discoverFilters discoverSimpleSearch" onSubmit={event => { event.preventDefault(); void loadProfiles(); }}>
        <label>Find people<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name, username, or location" maxLength={60}/></label>
        <button className="button" type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
        <details className="discoverAdvancedFilters"><summary>More filters</summary><div><label>Country<input value={country} onChange={event => setCountry(event.target.value)} placeholder="Any country" maxLength={80}/></label><label>Interest<input value={interest} onChange={event => setInterest(event.target.value)} placeholder="e.g. music" maxLength={32}/></label></div></details>
      </form>
      {error && <p role="alert" className="message">{error} <Link href="/profile">Set up your profile</Link>.</p>}{requestMessage && <p role="status" className="message">{requestMessage} <Link href="/friends">Manage requests</Link>.</p>}
      {loading ? <p role="status">Loading member profiles…</p> : !error && profiles.length === 0 ? <p>No discoverable profiles matched. Members must create a profile and choose Public or Signed-in members visibility.</p> : <div className="discoverGrid">{profiles.map(profile => <article className="discoverMember" key={profile.handle}><div className="discoverAvatar" aria-hidden="true">{profile.displayName.slice(0,1).toUpperCase()}</div><h2>{profile.displayName}</h2><p className="discoverHandle">@{profile.handle}</p><p>{profile.bio || "This member hasn’t added a bio yet."}</p><p className="discoverLocation">{[profile.region, profile.country].filter(Boolean).join(", ")}</p>{profile.interests.length > 0 && <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>}<button className="discoverConnectButton" disabled={!!sending} onClick={() => void sendRequest(profile.handle)}>{sending === profile.handle ? "Sending…" : "Add friend"}</button></article>)}</div>}
      <p className="switch"><Link href="/profile">Edit my profile</Link> · <Link href="/friends">Friend requests</Link> · <Link href="/safety">Safety Center</Link></p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Your people. Your passions. Your Connect.</footer>
  </main>;
}
