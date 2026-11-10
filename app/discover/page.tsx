"use client";

import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { useEffect, useState } from "react";

type MemberProfile = { handle: string; displayName: string; bio: string; country: string; region: string; interests: string[]; relationshipGoal?: string };

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState("");
  const [sort, setSort] = useState("recent");
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

  const sortedProfiles = [...profiles].sort((a, b) => sort === "name" ? a.displayName.localeCompare(b.displayName) : sort === "interests" ? b.interests.length - a.interests.length : 0);

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
    <section className="authCard discoverCard"><div className="eyebrow">CONNECT · FIND YOUR COMMUNITY</div><h1>Find your people</h1><p>Meet members, discover shared interests and grow your circle. Only profiles eligible for discovery are shown; blocked members stay hidden.</p>
      <form className="discoverFilters" onSubmit={event => { event.preventDefault(); void loadProfiles(); }}>
        <label>Search<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, bio, handle, or place" maxLength={60}/></label>
        <label>Country<input value={country} onChange={event => setCountry(event.target.value)} placeholder="Country" maxLength={80}/></label>
        <label>Interest<input value={interest} onChange={event => setInterest(event.target.value)} placeholder="e.g. music" maxLength={32}/></label>
        <label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently active</option><option value="name">Name A–Z</option><option value="interests">Most interests</option></select></label><button className="button" type="submit" disabled={loading}>{loading ? "Searching…" : "Find people"}</button>
      </form>
      {error && <p role="alert" className="message">{error} <Link href="/profile">Set up your profile</Link>.</p>}{requestMessage && <p role="status" className="message">{requestMessage} <Link href="/friends">Manage requests</Link>.</p>}
      {loading ? <p role="status">Loading member profiles…</p> : !error && profiles.length === 0 ? <p>No discoverable profiles matched. Members must create a profile and choose Public or Signed-in members visibility.</p> : <div className="discoverGrid">{sortedProfiles.map(profile => <article className="discoverMember discoverMemberPolished" key={profile.handle}><div className="discoverMemberTop"><div className="discoverAvatar" aria-hidden="true">{profile.displayName.slice(0,1).toUpperCase()}</div><span className="discoverMemberBadge">Connect member</span></div><h2>{profile.displayName}</h2><p className="discoverHandle">@{profile.handle}</p><p className="discoverMemberBio">{profile.bio || "A new face in the Connect community. Send a friendly hello."}</p><p className="discoverLocation"><span aria-hidden="true">⌖</span> {[profile.region, profile.country].filter(Boolean).join(", ") || "Location not shared"}</p>{profile.relationshipGoal && <span className="discoverGoal">{profile.relationshipGoal === "serious_relationship" ? "Serious relationship" : profile.relationshipGoal === "dating" ? "Dating" : "Friendship"}</span>}{profile.interests.length > 0 && <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>}<button className="discoverConnectButton" disabled={!!sending} onClick={() => void sendRequest(profile.handle)}>{sending === profile.handle ? "Sending…" : "＋ Add friend"}</button></article>)}</div>}
      <p className="switch"><Link href="/profile">Edit my profile</Link> · <Link href="/friends">Friend requests</Link> · <Link href="/safety">Safety Center</Link></p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Your people. Your passions. Your Connect.</footer>
  </main>;
}
