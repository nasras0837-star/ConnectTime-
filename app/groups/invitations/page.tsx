"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Invitation = { id: string; groupId: string; groupName: string; description: string; privacy: string; invitedAt: string };

export default function GroupInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/community/group-invitations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load invitations.");
      setInvitations(data.invitations || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load invitations."); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch invitation inbox on page entry.
  useEffect(() => { void refresh(); }, []);

  async function respond(invitation: Invitation, action: "accept" | "decline") {
    setBusy(invitation.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/group-invitations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId: invitation.id, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update invitation.");
      setInvitations(current => current.filter(item => item.id !== invitation.id));
      setNotice(action === "accept" ? `You joined ${invitation.groupName}.` : `Invitation to ${invitation.groupName} declined.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update invitation."); }
    finally { setBusy(""); }
  }

  return <main className="communityPage">
    <header className="communityHeader"><Link href="/" className="communityBrand">◉ ConnectTime</Link><nav><Link href="/groups">All groups</Link><Link href="/community">Community</Link><Link href="/account">Account</Link></nav></header>
    <section className="communityHero"><span>YOUR COMMUNITY</span><h1>Group invitations</h1><p>Review invitations from community group owners. Only verified adult members in good standing can accept.</p></section>
    <section className="groupDiscussionWrap">
      <div className="communityFeedHead"><div><span>INVITATION INBOX</span><h2>You&apos;re invited</h2></div><button type="button" onClick={() => void refresh()}>Refresh</button></div>
      {error && <p className="communityError" role="alert">{error}</p>}{notice && <p className="communityNotice" role="status">{notice}</p>}
      {loading ? <p className="communityEmpty">Loading invitations…</p> : invitations.length ? invitations.map(invitation => <article className="groupCard" key={invitation.id}><div><span className="groupPrivacy">{invitation.privacy.toUpperCase()}</span><h3>{invitation.groupName}</h3><p>{invitation.description || "A community group would like you to join its conversations."}</p></div><div className="groupCardActions"><button type="button" disabled={busy === invitation.id} onClick={() => void respond(invitation, "accept")}>{busy === invitation.id ? "Please wait…" : "Accept invitation"}</button><button className="secondary" type="button" disabled={busy === invitation.id} onClick={() => void respond(invitation, "decline")}>Decline</button></div></article>) : <div className="communityEmpty">No pending group invitations. Explore communities to find your people.</div>}
      <p><Link href="/groups">Explore community groups →</Link></p>
    </section>
    <footer className="communityFooter"><Link href="/legal/terms">Terms</Link> · <Link href="/safety">Safety Center</Link> · ConnectTime</footer>
  </main>;
}
