"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FeedPost = {
  id: string;
  body: string;
  createdAt: string;
  author: { handle: string; displayName: string };
};

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default function HomeCommunityFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/community/posts", { cache: "no-store" });
      setError("");
      const data = await response.json();
      if (response.status === 401) { setSignedOut(true); setPosts([]); return; }
      if (!response.ok) throw new Error(data.error || "The community feed is unavailable.");
      setSignedOut(false);
      setPosts(Array.isArray(data.posts) ? data.posts.slice(0, 4) : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The community feed is unavailable.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="homeSocialFeed" aria-labelledby="home-social-feed-title">
      <div className="homeSocialFeedHead">
        <div><span>THE COMMUNITY, RIGHT NOW</span><h2 id="home-social-feed-title">From your community</h2><p>Real updates shared by Connect members.</p></div>
        <Link href="/community">Open community →</Link>
      </div>
      {loading ? <p className="homeSocialFeedState" role="status">Loading the latest posts…</p> :
        signedOut ? <div className="homeSocialFeedJoin"><div><strong>Your community feed is waiting.</strong><p>Sign in to see member updates and join the conversation.</p></div><Link href="/login">Log in</Link></div> :
        error ? <div className="homeSocialFeedState" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setError(""); void load(); }}>Try again</button></div> :
        posts.length ? <div className="homeSocialFeedList">{posts.map(post => <article className="homeSocialFeedPost" key={post.id}>
          <div className="homeSocialFeedAvatar" aria-hidden="true">{(post.author.displayName || post.author.handle || "C").slice(0,1).toUpperCase()}</div>
          <div className="homeSocialFeedPostBody"><div className="homeSocialFeedByline"><strong>{post.author.displayName || post.author.handle}</strong><span>@{post.author.handle} · {relativeTime(post.createdAt)}</span></div><p>{post.body}</p><Link href="/community">Join the discussion →</Link></div>
        </article>)}</div> :
        <div className="homeSocialFeedJoin"><div><strong>Be one of the first to share.</strong><p>Start a conversation and help your community come alive.</p></div><Link href="/community">Create a post</Link></div>}
    </section>
  );
}
