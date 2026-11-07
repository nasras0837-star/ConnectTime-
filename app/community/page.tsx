"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Post = { id: string; body: string; createdAt: string; author: { handle: string; displayName: string }; mine: boolean };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString();
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/community/posts", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the community feed.");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the community feed.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishing(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: draft }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your post could not be published.");
      setPosts(current => [data.post, ...current]);
      setDraft("");
      setNotice("Your post is now published.");
    } catch (e) { setError(e instanceof Error ? e.message : "Your post could not be published."); }
    finally { setPublishing(false); }
  }

  async function report(post: Post) {
    const details = window.prompt("Tell our safety team why this post should be reviewed (at least 10 characters).");
    if (!details || details.trim().length < 10) return;
    try {
      const response = await fetch("/api/community/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "other", targetType: "post", contentReference: post.id, details: details.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Report could not be submitted.");
      setNotice("Thank you. Your report was submitted for review.");
    } catch (e) { setError(e instanceof Error ? e.message : "Report could not be submitted."); }
  }

  return <main className="communityPage">
    <header className="communityHeader"><Link href="/" className="communityBrand">◉ ConnectTime</Link><nav><Link href="/">Home</Link><Link href="/discover">Discover</Link><Link href="/friends">Friends</Link><Link href="/messages">Messages</Link><Link href="/account">Account</Link></nav></header>
    <section className="communityHero"><span>THE CONNECTTIME COMMUNITY</span><h1>Ideas, stories & <em>real connections.</em></h1><p>A place for conversation, creativity, good-faith debate and shared interests. Adults 18+; harassment and intimidation are not allowed.</p></section>
    <section className="communityLayout">
      <div className="communityMain">
        <form className="communityComposer" onSubmit={publish}>
          <div className="communityComposerTitle"><div><span>YOUR VOICE MATTERS</span><h2>Share an update</h2></div><small>{draft.length}/1500</small></div>
          <textarea value={draft} onChange={e => setDraft(e.target.value.slice(0,1500))} maxLength={1500} rows={4} placeholder="What would you like the community to know?" required/>
          <div className="communityComposerFoot"><span>Text posts only for now. Photo and video publishing remain disabled until moderation is ready.</span><button type="submit" disabled={publishing || !draft.trim()}>{publishing ? "Publishing…" : "Publish post"}</button></div>
        </form>
        {notice && <p className="communityNotice" role="status">{notice}</p>}
        {error && <p className="communityError" role="alert">{error}</p>}
        <div className="communityFeedHead"><div><span>COMMUNITY CONVERSATION</span><h2>Latest posts</h2></div><button type="button" onClick={() => void refresh()}>Refresh</button></div>
        {loading ? <p className="communityEmpty">Loading community posts…</p> : posts.length ? <div className="communityPosts">{posts.map(post => <article className="communityPost" key={post.id}>
          <div className="communityPostHead"><div className="communityAvatar">{(post.author.displayName || post.author.handle || "C").slice(0,1).toUpperCase()}</div><div><b>{post.author.displayName || post.author.handle}</b><span>@{post.author.handle} · {formatDate(post.createdAt)}</span></div><button type="button" onClick={() => void report(post)} aria-label="Report this post">Report</button></div>
          <p>{post.body}</p>
        </article>)}</div> : <div className="communityEmpty">There are no posts yet. Start the conversation with a thoughtful first post.</div>}
      </div>
      <aside className="communitySidebar"><div><span>COMMUNITY STANDARDS</span><h3>Open expression. No intimidation.</h3><p>Debate, criticism, satire, political and social viewpoints, and unpopular opinions are welcome. Threats, targeted harassment, stalking, doxxing, blackmail and privacy violations are not.</p><Link href="/safety">Visit Safety Center ↗</Link></div><div><span>MORE TO EXPLORE</span><Link href="/news">News & current affairs ↗</Link><Link href="/free-tv">Free TV directory ↗</Link><Link href="/events">Community events ↗</Link><Link href="/discover">Find members ↗</Link></div></aside>
    </section>
    <footer className="communityFooter">ConnectTime · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · Adults 18+</footer>
  </main>;
}
