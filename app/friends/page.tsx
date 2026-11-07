"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id: string; direction: string; status: string; createdAt: string; profile: { handle: string; displayName: string; country: string } };
type Data = { incoming: Entry[]; outgoing: Entry[]; connections: Entry[] };

export default function FriendsPage() {
  const [data, setData] = useState<Data>({ incoming: [], outgoing: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setError("");
    try {
      const response = await fetch("/api/friends/requests", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Friend requests are unavailable.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Friend requests are unavailable."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/friends/requests", { cache: "no-store" })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Friend requests are unavailable."); if (!cancelled) setData(result); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Friend requests are unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function action(id: string, method: "PATCH" | "DELETE", actionName?: "accept" | "decline") {
    setBusy(id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/friends/requests", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, ...(actionName ? { action: actionName } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "That action could not be completed.");
      setNotice(method === "DELETE" ? "Request cancelled." : actionName === "accept" ? "You are now connected." : "Request declined.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "That action could not be completed."); }
    finally { setBusy(""); }
  }

  const card = (entry: Entry, kind: "incoming" | "outgoing" | "connection") => <article className="friendEntry" key={entry.id}>
    <div className="discoverAvatar" aria-hidden="true">{entry.profile.displayName.slice(0, 1).toUpperCase()}</div>
    <div className="friendEntryCopy"><strong>{entry.profile.displayName}</strong><span>@{entry.profile.handle}{entry.profile.country ? " · " + entry.profile.country : ""}</span></div>
    {kind === "incoming" && <div className="friendEntryActions"><button disabled={busy === entry.id} onClick={() => void action(entry.id, "PATCH", "accept")}>Accept</button><button className="secondary" disabled={busy === entry.id} onClick={() => void action(entry.id, "PATCH", "decline")}>Decline</button></div>}
    {kind === "outgoing" && <div className="friendEntryActions"><span>Pending</span><button className="secondary" disabled={busy === entry.id} onClick={() => void action(entry.id, "DELETE")}>Cancel</button></div>}
    {kind === "connection" && <div className="friendEntryActions"><span className="friendConnected">Connected</span><Link className="friendMessageLink" href={"/messages?with=" + encodeURIComponent(entry.profile.handle)}>Message</Link></div> }
  </article>;

  return <main className="authShell"><header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connecttime-logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/discover">Discover</Link><Link href="/profile">My profile</Link></nav></header>
    <section className="authCard friendsCard"><div className="eyebrow">CONNECT · YOUR CIRCLE</div><h1>Friends & requests</h1><p>Choose who joins your circle. Only verified adult members with active accounts can connect.</p>
      {error && <p className="message" role="alert">{error}</p>}{notice && <p className="message" role="status">{notice}</p>}
      {loading ? <p role="status">Loading your connections…</p> : <>
        <section className="friendSection"><div className="friendSectionHead"><h2>Incoming requests</h2><span>{data.incoming.length}</span></div>{data.incoming.length ? data.incoming.map(entry => card(entry, "incoming")) : <p className="friendEmpty">No incoming requests right now.</p>}</section>
        <section className="friendSection"><div className="friendSectionHead"><h2>Sent requests</h2><span>{data.outgoing.length}</span></div>{data.outgoing.length ? data.outgoing.map(entry => card(entry, "outgoing")) : <p className="friendEmpty">You have no pending sent requests.</p>}</section>
        <section className="friendSection"><div className="friendSectionHead"><h2>Your connections</h2><span>{data.connections.length}</span></div>{data.connections.length ? data.connections.map(entry => card(entry, "connection")) : <p className="friendEmpty">Your circle is ready to grow. Discover members to connect.</p>}</section>
      </>}
      <div className="introActions"><Link href="/discover">Discover members</Link><Link className="introExplore" href="/safety">Safety Center</Link></div>
      <p className="switch"><Link href="/account">Back to account</Link> · <button className="friendRefresh" onClick={() => void refresh()}>Refresh requests</button></p>
    </section><footer className="plannedFeatureFooter">ConnectTime · Your people. Your passions. Your ConnectTime.</footer>
  </main>;
}
