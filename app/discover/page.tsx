"use client";

import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { useCallback, useEffect, useState } from "react";

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
  const [connectedHandles, setConnectedHandles] = useState<string[]>([]);
  const [outgoingHandles, setOutgoingHandles] = useState<string[]>([]);
  const [incomingHandles, setIncomingHandles] = useState<string[]>([]);

  const refreshFriendStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/friends/requests", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) return;
      setConnectedHandles((result.connections || []).map((entry: { profile: { handle: string } }) => entry.profile.handle.toLowerCase()));
      setOutgoingHandles((result.outgoing || []).map((entry: { profile: { handle: string } }) => entry.profile.handle.toLowerCase()));
      setIncomingHandles((result.incoming || []).map((entry: { profile: { handle: string } }) => entry.profile.handle.toLowerCase()));
    } catch { /* Discovery remains usable if request status is temporarily unavailable. */ }
  }, []);

  async function sendRequest(handle: string) {
    setSending(handle); setError(""); setRequestMessage("");
    try {
      const response = await fetch("/api/friends/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: handle }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request could not be sent.");
      setRequestMessage(result.alreadyPending ? "A request is already pending." : "Friend request sent.");
      await refreshFriendStatus();
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
    void refreshFriendStatus();
    fetch("/api/discover/profiles", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Member discovery is unavailable.");
        if (!cancelled) setProfiles(data.profiles || []);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Member discovery is unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshFriendStatus]);

  return <main className="connectFeatureShell"><ConnectSiteHeader />
    <section className="authCard discoverCard"><div className="eyebrow">CONNECT · FIND YOUR COMMUNITY</div><h1>Discover members</h1><p>Explore profiles shared by verified adult members. People who have blocked you or whom you have blocked are hidden.</p>
      <form className="discoverFilters" onSubmit={event => { event.preventDefault(); void loadProfiles(); }}>
        <label>Search<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, bio, handle, or place" maxLength={60}/></label>
        <label>Country<input value={country} onChange={event => setCountry(event.target.value)} placeholder="Country" maxLength={80}/></label>
        <label>Interest<input value={interest} onChange={event => setInterest(event.target.value)} placeholder="e.g. music" maxLength={32}/></label>
        <button className="button" type="submit" disabled={loading}>{loading ? "Searching…" : "Search members"}</button>
      </form>
      {error && <p role="alert" className="message">{error} <Link href="/profile">Set up your profile</Link>.</p>}{requestMessage && <p role="status" className="message">{requestMessage} <Link href="/friends">Manage requests</Link>.</p>}
      {loading ? <p role="status">Loading member profiles…</p> : !error && profiles.length === 0 ? <p>No discoverable profiles matched. Members must create a profile and choose Public or Signed-in members visibility.</p> : <div className="discoverGrid">{profiles.map(profile => <article className="discoverMember" key={profile.handle}><div className="discoverAvatar" aria-hidden="true">{profile.displayName.slice(0,1).toUpperCase()}</div><h2>{profile.displayName}</h2><p className="discoverHandle">@{profile.handle}</p><p>{profile.bio || "This member hasn’t added a bio yet."}</p><p className="discoverLocation">{[profile.region, profile.country].filter(Boolean).join(", ")}</p>{profile.interests.length > 0 && <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>}{connectedHandles.includes(profile.handle.toLowerCase()) ? <Link className="discoverConnectButton" href={"/messages?with=" + encodeURIComponent(profile.handle)}>Message</Link> : incomingHandles.includes(profile.handle.toLowerCase()) ? <Link className="discoverConnectButton" href="/friends">Respond to request</Link> : outgoingHandles.includes(profile.handle.toLowerCase()) ? <span className="discoverConnectButton" aria-label="Friend request pending">Request sent</span> : <button className="discoverConnectButton" disabled={!!sending} onClick={() => void sendRequest(profile.handle)}>{sending === profile.handle ? "Sending…" : "Add friend"}</button>}</article>)}</div>}
      <p className="switch"><Link href="/profile">Edit my profile</Link> · <Link href="/friends">Friend requests</Link> · <Link href="/safety">Safety Center</Link></p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Your people. Your passions. Your Connect.</footer>
  </main>;
}
