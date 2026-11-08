"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type DatingProfile = { handle: string; displayName: string; country: string; age: number; gender: string; interests: string[] };
type IncomingLike = { id: string; createdAt: string; profile: DatingProfile; matched: boolean };
type InboxData = { received: IncomingLike[]; sent: DatingProfile[]; matches: IncomingLike[] };
type FriendRequestData = { incoming: { id: string; profile: { handle: string } }[]; outgoing: { profile: { handle: string } }[]; connections: { profile: { handle: string } }[] };

export default function DatingLikesPage() {
  const [data, setData] = useState<InboxData>({ received: [], sent: [], matches: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"received" | "matches" | "sent">("received");
  const [friendState, setFriendState] = useState<FriendRequestData>({ incoming: [], outgoing: [], connections: [] });

  const refresh = useCallback(async (silent = false) => {
    try {
      const response = await fetch("/api/dating/likes", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your dating inbox is unavailable.");
      setData({ received: result.received || [], sent: result.sent || [], matches: result.matches || [] });
      try {
        const friendsResponse = await fetch("/api/friends/requests", { cache: "no-store" });
        const friendsResult = await friendsResponse.json();
        if (friendsResponse.ok) setFriendState({ incoming: friendsResult.incoming || [], outgoing: friendsResult.outgoing || [], connections: friendsResult.connections || [] });
      } catch { /* Dating likes remain available if the optional friends service is offline. */ }
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Your dating inbox is unavailable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => refresh());
    const poll = () => { if (document.visibilityState === "visible") void refresh(true); };
    const interval = window.setInterval(poll, 15000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refresh]);

  async function likeBack(profile: DatingProfile) {
    setBusy(profile.handle); setError(""); setNotice("");
    try {
      const response = await fetch("/api/dating/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: profile.handle }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not like this member.");
      setNotice(result.matched ? "It's a match! You both like each other." : "Like sent.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not like this member."); }
    finally { setBusy(""); }
  }

  async function dismiss(likeId: string) {
    setBusy(likeId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/dating/likes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ likeId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not dismiss this like.");
      setNotice("Like dismissed.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not dismiss this like."); }
    finally { setBusy(""); }
  }

  async function addFriend(profile: DatingProfile) {
    setBusy(profile.handle); setError(""); setNotice("");
    try {
      const response = await fetch("/api/friends/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: profile.handle }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send a friend request.");
      setNotice(result.alreadyPending ? "A friend request is already pending." : "Friend request sent. Once accepted, you can message each other.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send a friend request."); }
    finally { setBusy(""); }
  }

  async function acceptFriendRequest(requestId: string) {
    setBusy(requestId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/friends/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action: "accept" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not accept this friend request.");
      setNotice("You are now connected. Private messaging is available.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not accept this friend request."); }
    finally { setBusy(""); }
  }

  const profileCard = (profile: DatingProfile, actions: ReactNode, key: string) => (
    <article className="datingInboxCard" key={key}>
      <div className="discoverAvatar" aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</div>
      <div className="datingInboxCopy">
        <h3>{profile.displayName}, {profile.age}</h3>
        <span>@{profile.handle}{profile.country ? " · " + profile.country : ""}</span>
        <div className="discoverTags">{profile.interests.map(item => <span key={item}>{item}</span>)}</div>
      </div>
      <div className="datingInboxActions">{actions}</div>
    </article>
  );

  const selectedItems = tab === "received" ? data.received : tab === "matches" ? data.matches : data.sent.map(profile => ({ id: profile.handle, profile, matched: false, createdAt: "" }));

  return <main className="authShell">
    <header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/dating">Discover dating</Link><Link href="/friends">Friends</Link><Link href="/messages">Messages</Link></nav></header>
    <section className="authCard friendsCard datingInboxPage">
      <div className="eyebrow">CONNECT DATING · YOUR CONNECTIONS</div>
      <h1>Likes & matches</h1>
      <p>See who is interested, like someone back to make a mutual match, and decide who you want to add to your Connect circle.</p>
      {error && <p className="message" role="alert">{error}</p>}
      {notice && <p className="message" role="status">{notice}</p>}
      <div className="datingInboxTabs" role="tablist" aria-label="Dating inbox">
        <button type="button" role="tab" aria-selected={tab === "received"} onClick={() => setTab("received")}>Likes received <span>{data.received.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "matches"} onClick={() => setTab("matches")}>Mutual matches <span>{data.matches.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "sent"} onClick={() => setTab("sent")}>Likes sent <span>{data.sent.length}</span></button>
      </div>
      {loading ? <p role="status">Loading your dating inbox…</p> : selectedItems.length ? <div className="datingInboxList">
        {selectedItems.map(item => profileCard(item.profile,
          tab === "received" && !item.matched ? <>
            <button type="button" disabled={busy === item.id || !!busy} onClick={() => void likeBack(item.profile)}>♥ Like back</button>
            <button type="button" className="secondary" disabled={busy === item.id || !!busy} onClick={() => void dismiss(item.id)}>Dismiss</button>
          </> : tab === "matches" || (tab === "received" && item.matched) ? <>
            <span className="datingMatchBadge">♥ Mutual match</span>
            {friendState.connections.some(entry => entry.profile.handle === item.profile.handle) ? <Link className="friendMessageLink" href={"/messages?with=" + encodeURIComponent(item.profile.handle)}>Message</Link> :
              friendState.incoming.find(entry => entry.profile.handle === item.profile.handle) ? <button type="button" disabled={!!busy} onClick={() => void acceptFriendRequest(friendState.incoming.find(entry => entry.profile.handle === item.profile.handle)!.id)}>Accept friend request</button> :
              friendState.outgoing.some(entry => entry.profile.handle === item.profile.handle) ? <span className="datingSentBadge">Friend request pending</span> :
              <button type="button" disabled={!!busy} onClick={() => void addFriend(item.profile)}>Add to friends</button>}
          </> : <span className="datingSentBadge">Like sent</span>,
          item.id
        ))}
      </div> : <div className="datingInboxEmpty">
        <strong>{tab === "received" ? "No likes received yet" : tab === "matches" ? "Your matches will appear here" : "You haven't sent any likes yet"}</strong>
        <p>{tab === "received" ? "When someone likes your dating profile, you’ll see them here." : tab === "matches" ? "When you and another member like each other, you’ll find your match here." : "Explore profiles that share your interests and let someone know you’re interested."}</p>
        <Link href="/dating">Discover people</Link>
      </div>}
      <p className="switch"><Link href="/dating">Back to dating discovery</Link> · <Link href="/friends">Manage friend connections</Link> · <button className="friendRefresh" onClick={() => void refresh()}>Refresh inbox</button></p>
      <p className="datingInboxFootnote">Private messages remain available after a friend request is accepted. You can manage accepted connections in Friends.</p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Mutual interest, meaningful connections.</footer>
  </main>;
}
