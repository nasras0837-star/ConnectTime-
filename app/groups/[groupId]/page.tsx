"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Post = { id: string; body: string; createdAt: string; author: { handle: string; displayName: string } };
type Group = { id: string; name: string; description: string; privacy: string };

export default function GroupDiscussionPage({ params }: { params: Promise<{ groupId: string }> }) {
  const [groupId, setGroupId] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
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
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load group discussion."); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Load discussion when route parameter resolves.
  useEffect(() => { if (groupId) void refresh(); }, [groupId]);

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
      <form className="communityComposer" onSubmit={publish}><div className="communityComposerTitle"><div><span>SHARE WITH THIS GROUP</span><h2>Start a discussion</h2></div><small>{draft.length}/1500</small></div><textarea value={draft} onChange={e => setDraft(e.target.value.slice(0,1500))} maxLength={1500} rows={4} required placeholder="Share an idea or ask the group a question…" /><div className="communityComposerFoot"><span>Respectful discussion is encouraged. Text only for now.</span><button type="submit" disabled={busy || !draft.trim()}>{busy ? "Publishing…" : "Publish"}</button></div></form>
      <div className="communityFeedHead"><div><span>GROUP CONVERSATION</span><h2>Recent discussions</h2></div><button type="button" onClick={() => void refresh()}>Refresh</button></div>
      {loading ? <p className="communityEmpty">Loading discussion…</p> : posts.length ? <div className="communityPosts">{posts.map(post => <article className="communityPost" key={post.id}><div className="communityPostHead"><div className="communityAvatar">{(post.author.displayName || "M").slice(0,1).toUpperCase()}</div><div><b>{post.author.displayName}</b><span>@{post.author.handle} · {new Date(post.createdAt).toLocaleString()}</span></div></div><p>{post.body}</p></article>)}</div> : <div className="communityEmpty">No discussions yet. Start the conversation.</div>}
    </section>
    <footer className="communityFooter">ConnectTime · <Link href="/safety">Safety Center</Link></footer>
  </main>;
}
