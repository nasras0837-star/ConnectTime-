"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Group = { id: string; name: string; description: string; privacy: string; membership: string; member: boolean; requestPending?: boolean; createdAt: string };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [membership, setMembership] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/community/groups", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load groups.");
      setGroups(data.groups || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load groups."); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch initial server-backed group directory.
  useEffect(() => { void refresh(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("create"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, privacy, membership }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create group.");
      setGroups(current => [data.group, ...current]); setName(""); setDescription("");
      setNotice("Your group has been created.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create group."); }
    finally { setBusy(""); }
  }

  async function join(group: Group) {
    setBusy(group.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/community/groups/${encodeURIComponent(group.id)}/membership`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join group.");
      setNotice(data.pending ? "Your membership request is pending approval." : "You joined the group.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not join group."); }
    finally { setBusy(""); }
  }

  async function leave(group: Group) {
    if (!window.confirm(`Leave “${group.name}”?`)) return;
    setBusy(group.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/community/groups/${encodeURIComponent(group.id)}/membership`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not leave group.");
      setNotice("You left the group."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not leave group."); }
    finally { setBusy(""); }
  }

  return <main className="communityPage">
    <header className="communityHeader"><Link href="/" className="communityBrand">◉ ConnectTime</Link><nav><Link href="/">Home</Link><Link href="/community">Community</Link><Link href="/discover">Discover</Link><Link href="/account">Account</Link></nav></header>
    <section className="communityHero"><span>FIND YOUR PEOPLE</span><h1>Communities for <em>every interest.</em></h1><p>Create a group, join conversations, and connect around shared interests. Group content follows its privacy settings. Verified adult members only.</p></section>
    <section className="groupsLayout">
      <div className="groupsDirectory"><div className="communityFeedHead"><div><span>DISCOVER</span><h2>Available groups</h2></div><button type="button" onClick={() => void refresh()}>Refresh</button></div>
        {error && <p className="communityError" role="alert">{error}</p>}{notice && <p className="communityNotice" role="status">{notice}</p>}
        {loading ? <p className="communityEmpty">Loading groups…</p> : groups.length ? groups.map(group => <article className="groupCard" key={group.id}><div><span className="groupPrivacy">{group.privacy === "public" ? "PUBLIC" : group.privacy === "members" ? "MEMBERS ONLY" : "PRIVATE"}</span><h3>{group.name}</h3><p>{group.description || "A place to connect and share ideas."}</p><small>{group.membership === "approval" ? "Approval required" : "Open membership"}</small></div><div className="groupCardActions">{group.member ? <><Link href={`/groups/${encodeURIComponent(group.id)}`}>Open discussion</Link><button type="button" disabled={busy === group.id} onClick={() => void leave(group)}>Leave</button></> : group.requestPending ? <span className="groupPrivacy" role="status">REQUEST PENDING</span> : group.privacy === "private" ? <span>Invitation only</span> : <button type="button" disabled={busy === group.id} onClick={() => void join(group)}>{busy === group.id ? "Please wait…" : group.membership === "approval" ? "Request to join" : "Join group"}</button>}</div></article>) : <div className="communityEmpty">No groups yet. Create the first community.</div>}
      </div>
      <aside className="groupCreateCard"><span>START A COMMUNITY</span><h2>Create a group</h2><p>Choose who can discover the group and whether membership is open or requires approval.</p><form onSubmit={create}><label>Group name<input value={name} onChange={e => setName(e.target.value)} minLength={3} maxLength={70} required placeholder="e.g. Local photography" /></label><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={4} placeholder="What is this group about?" /></label><label>Who can discover it<select value={privacy} onChange={e => setPrivacy(e.target.value)}><option value="public">Public — anyone signed in</option><option value="members">Members — discoverable, discussion members only</option><option value="private">Private — members only, invitation required</option></select></label><label>Membership<select value={membership} onChange={e => setMembership(e.target.value)}><option value="open">Open — join immediately</option><option value="approval">Approval required</option></select></label><button type="submit" disabled={busy === "create"}>{busy === "create" ? "Creating…" : "Create group"}</button></form><small>Group owners are automatically enrolled. Owners cannot leave their group until ownership is transferred or the group is closed.</small></aside>
    </section>
    <footer className="communityFooter"><Link href="/legal/terms">Terms</Link> · <Link href="/safety">Safety Center</Link> · ConnectTime</footer>
  </main>;
}
