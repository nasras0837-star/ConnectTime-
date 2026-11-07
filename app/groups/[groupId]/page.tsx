"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Post = { id: string; body: string; createdAt: string; author: { handle: string; displayName: string } };
type Group = { id: string; name: string; description: string; privacy: string };
type JoinRequest = { id: string; handle: string; displayName: string; country: string };
type GroupMember = JoinRequest & { role: string; isCurrentUser: boolean };

export default function GroupDiscussionPage({ params }: { params: Promise<{ groupId: string }> }) {
  const [groupId, setGroupId] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [decisionBusy, setDecisionBusy] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { let active = true; void params.then(value => { if (active) setGroupId(value.groupId); }); return () => { active = false; }; }, [params]);

  async function refresh() {
    if (!groupId) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/community/groups/${encodeURIComponent(groupId)}/posts`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load group discussion.");
      setGroup(data.group); setPosts(data.posts || []);
      const membersResponse = await fetch(`/api/community/groups/${encodeURIComponent(groupId)}/members`, { cache: "no-store" });
      if (membersResponse.ok) { const membersData = await membersResponse.json(); setIsOwner(Boolean(membersData.isOwner)); setJoinRequests(membersData.requests || []); setMembers(membersData.members || []); }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load group discussion."); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Load discussion when route parameter resolves.
  useEffect(() => { if (groupId) void refresh(); }, [groupId]);

  async function decideJoinRequest(membershipId: string, action: "approve" | "decline" | "remove" | "transfer") {
    setDecisionBusy(membershipId); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/community/groups/${encodeURIComponent(groupId)}/members`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipId, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update membership request.");
      setNotice(action === "approve" ? "Member approved and added to the group." : action === "decline" ? "Membership request declined." : action === "remove" ? "Member removed from the group." : "Group ownership transferred. Your role is now member.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update membership request."); }
    finally { setDecisionBusy(""); }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/community/groups/${encodeURIComponent(groupId)}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: draft }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not publish.");
      setPosts(current => [data.post, ...current]); setDraft(""); setNotice("Your discussion post was published.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not publish."); }
    finally { setBusy(false); }
  }

  return <main className="communityPage">
    <header className="communityHeader"><Link href="/" className="communityBrand">◉ ConnectTime</Link><nav><Link href="/groups">All groups</Link><Link href="/community">Community</Link><Link href="/account">Account</Link></nav></header>
    <section className="communityHero"><span>GROUP DISCUSSION</span><h1>{group?.name || "Community group"}</h1><p>{group?.description || "A shared space for discussion."}</p></section>
    <section className="groupDiscussionWrap"><Link href="/groups">← Back to groups</Link>
      {error && <p className="communityError" role="alert">{error}</p>}{notice && <p className="communityNotice" role="status">{notice}</p>}
      {isOwner && <section className="groupOwnerRequests">
        <div className="communityFeedHead"><div><span>GROUP ADMINISTRATION</span><h2>Join requests</h2></div><strong>{joinRequests.length}</strong></div>
        {joinRequests.length ? joinRequests.map(request => <article className="friendEntry" key={request.id}>
          <div className="discoverAvatar" aria-hidden="true">{request.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="friendEntryCopy"><strong>{request.displayName}</strong><span>@{request.handle}{request.country ? " · " + request.country : ""}</span></div>
          <div className="friendEntryActions"><button type="button" disabled={decisionBusy === request.id} onClick={() => void decideJoinRequest(request.id, "approve")}>Approve</button><button type="button" className="secondary" disabled={decisionBusy === request.id} onClick={() => void decideJoinRequest(request.id, "decline")}>Decline</button></div>
        </article>) : <p className="communityEmpty">No membership requests are waiting for approval.</p>}
      </section>}
      {isOwner && <section className="groupOwnerRequests">
        <div className="communityFeedHead"><div><span>GROUP ADMINISTRATION</span><h2>Current members</h2></div><strong>{members.length}</strong></div>
        {members.map(member => <article className="friendEntry" key={member.id}>
          <div className="discoverAvatar" aria-hidden="true">{member.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="friendEntryCopy"><strong>{member.displayName} {member.role === "owner" ? "· Owner" : ""}</strong><span>@{member.handle}{member.country ? " · " + member.country : ""}</span></div>
          {member.role !== "owner" && <div className="friendEntryActions">
            <button type="button" className="secondary" disabled={Boolean(decisionBusy)} onClick={() => { if (window.confirm(`Remove @${member.handle} from this group?`)) void decideJoinRequest(member.id, "remove"); }}>Remove</button>
            <button type="button" className="secondary" disabled={Boolean(decisionBusy)} onClick={() => { if (window.confirm(`Transfer group ownership to @${member.handle}? You will become a regular member.`)) void decideJoinRequest(member.id, "transfer"); }}>Transfer ownership</button>
          </div>}
        </article>)}
      </section>}
      <form className="communityComposer" onSubmit={publish}><div className="communityComposerTitle"><div><span>SHARE WITH THIS GROUP</span><h2>Start a discussion</h2></div><small>{draft.length}/1500</small></div><textarea value={draft} onChange={e => setDraft(e.target.value.slice(0,1500))} maxLength={1500} rows={4} required placeholder="Share an idea or ask the group a question…" /><div className="communityComposerFoot"><span>Respectful discussion is encouraged. Text only for now.</span><button type="submit" disabled={busy || !draft.trim()}>{busy ? "Publishing…" : "Publish"}</button></div></form>
      <div className="communityFeedHead"><div><span>GROUP CONVERSATION</span><h2>Recent discussions</h2></div><button type="button" onClick={() => void refresh()}>Refresh</button></div>
      {loading ? <p className="communityEmpty">Loading discussion…</p> : posts.length ? <div className="communityPosts">{posts.map(post => <article className="communityPost" key={post.id}><div className="communityPostHead"><div className="communityAvatar">{(post.author.displayName || "M").slice(0,1).toUpperCase()}</div><div><b>{post.author.displayName}</b><span>@{post.author.handle} · {new Date(post.createdAt).toLocaleString()}</span></div></div><p>{post.body}</p></article>)}</div> : <div className="communityEmpty">No discussions yet. Start the conversation.</div>}
    </section>
    <footer className="communityFooter">ConnectTime · <Link href="/safety">Safety Center</Link></footer>
  </main>;
}
