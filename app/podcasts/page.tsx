"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import "./podcasts.css";

type Episode = { id: string; title: string; description: string; duration: string; status: string; audioUrl: string; createdAt: string };
type Show = { id: string; title: string; description: string; category: string; artworkUrl: string; creatorName: string; status: string; episodes: Episode[] };
const categories = ["Arts & culture", "Business", "Comedy", "Education", "Entertainment", "Health & wellness", "News & politics", "Science & technology", "Society & relationships", "Sports", "Storytelling"];
const blankShow = { title: "", description: "", category: "Entertainment", artworkUrl: "" };
const blankEpisode = { title: "", description: "" };

export default function PodcastsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [episodeShow, setEpisodeShow] = useState("");
  const [showDraft, setShowDraft] = useState(blankShow);
  const [episodeDraft, setEpisodeDraft] = useState(blankEpisode);
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/podcasts" + (mine ? "?mine=1" : ""), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load podcasts.");
      setShows(data.shows || []);
    } catch (e) { setShows([]); setError(e instanceof Error ? e.message : "Unable to load podcasts."); }
    finally { setLoading(false); }
  }, [mine]);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => shows.filter(show => [show.title, show.description, show.category, show.creatorName].join(" ").toLowerCase().includes(query.toLowerCase())), [shows, query]);

  async function createShow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/podcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_show", ...showDraft }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create podcast.");
      setNotice(data.message || "Podcast submitted for review."); setShowDraft(blankShow); setShowForm(false); setMine(true); 
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create podcast."); }
    finally { setSaving(false); }
  }

  async function uploadEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!audio || !episodeShow) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const body = new FormData(); body.set("showId", episodeShow); body.set("title", episodeDraft.title); body.set("description", episodeDraft.description); body.set("audio", audio);
      const response = await fetch("/api/podcasts", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not upload episode.");
      setNotice(data.message || "Episode submitted for review."); setEpisodeDraft(blankEpisode); setAudio(null); setEpisodeShow(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload episode."); }
    finally { setSaving(false); }
  }

  return <main className="podcastsPage">
    <header className="podcastsHeader"><Link href="/" className="podcastsBrand"><Image src="/connect-logo.svg" alt="Connect" width={118} height={78} priority/></Link><nav><Link href="/">Home</Link><Link href="/community">Community</Link><Link href="/videos">Video Tube</Link><Link href="/radio">Radio</Link></nav></header>
    <section className="podcastsHero"><span className="podcastsEyebrow">CONNECT ORIGINALS · AUDIO COMMUNITY</span><h1>Every voice has<br/><em>a story to share.</em></h1><p>Create your own podcast, publish episodes, and discover voices and ideas from the Connect community—all without leaving Connect.</p><div className="podcastsHeroActions"><button type="button" onClick={() => { setShowForm(v => !v); setNotice(""); }}>＋ Create a podcast</button><a href="#podcast-discover">Explore podcasts ↓</a></div><div className="podcastsTags"><span>🎙️ Creator-owned shows</span><span>🎧 Audio episodes</span><span>🌍 Discover worldwide</span><span>🛡️ Reviewed publishing</span></div></section>
    <section className="podcastsMain" id="podcast-discover">
      <div className="podcastsSectionHead"><div><span>YOUR CONNECT PODCAST STUDIO</span><h2>{mine ? "My podcasts" : "Discover podcasts"}</h2><p>{mine ? "Manage your submitted shows and episodes." : "Browse shows and listen to published episodes from Connect creators."}</p></div><div className="podcastsTabs"><button className={!mine ? "active" : ""} onClick={() => setMine(false)}>Discover</button><button className={mine ? "active" : ""} onClick={() => setMine(true)}>My podcasts</button></div></div>
      <div className="podcastsToolbar"><input aria-label="Search podcasts" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search shows, creators, or topics…"/><button type="button" onClick={() => void load()}>↻ Refresh</button></div>
      {notice && <div className="podcastsNotice" role="status">{notice}</div>}
      {error && <div className="podcastsError" role="alert">{error} <Link href="/login">Sign in</Link> or retry.</div>}
      {showForm && <form className="podcastsForm" onSubmit={createShow}><div className="podcastsFormHead"><div><span>START YOUR SHOW</span><h3>Create a podcast</h3><p>Your show will be reviewed before appearing in public discovery.</p></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close">×</button></div><label>Podcast name<input required maxLength={90} value={showDraft.title} onChange={e => setShowDraft(v => ({...v,title:e.target.value}))} placeholder="The conversations that matter"/></label><label>Category<select value={showDraft.category} onChange={e => setShowDraft(v => ({...v,category:e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Show description<textarea required maxLength={600} rows={3} value={showDraft.description} onChange={e => setShowDraft(v => ({...v,description:e.target.value}))} placeholder="What will listeners discover in your show?"/></label><label>Cover artwork URL (optional)<input type="url" value={showDraft.artworkUrl} onChange={e => setShowDraft(v => ({...v,artworkUrl:e.target.value}))} placeholder="https://…"/></label><button type="submit" disabled={saving}>{saving ? "Submitting…" : "Create show for review"}</button></form>}
      {episodeShow && <form className="podcastsForm" onSubmit={uploadEpisode}><div className="podcastsFormHead"><div><span>ADD A NEW EPISODE</span><h3>Publish an episode</h3><p>Audio uploads up to 40 MB. Episodes are reviewed before publication.</p></div><button type="button" onClick={() => setEpisodeShow("")} aria-label="Close">×</button></div><label>Episode title<input required maxLength={90} value={episodeDraft.title} onChange={e => setEpisodeDraft(v => ({...v,title:e.target.value}))} placeholder="Episode 1 — The beginning"/></label><label>Episode description<textarea maxLength={600} rows={3} value={episodeDraft.description} onChange={e => setEpisodeDraft(v => ({...v,description:e.target.value}))} placeholder="What is this episode about?"/></label><label>Audio file<input required type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,audio/flac" onChange={e => setAudio(e.target.files?.[0] || null)}/></label><button type="submit" disabled={saving || !audio}>{saving ? "Uploading…" : "Upload episode for review"}</button></form>}
      {loading ? <div className="podcastsEmpty" role="status">Loading Connect podcasts…</div> : !error && <div className="podcastsGrid">{visible.map(show => <article className="podcastCard" key={show.id}><div className="podcastArtwork">{show.artworkUrl ? <img src={show.artworkUrl} alt="" loading="lazy"/> : <span>🎙️</span>}<small>{show.category}</small></div><div className="podcastCardBody"><div className="podcastCreator">BY {show.creatorName.toUpperCase()} · {show.status === "published" ? "PUBLISHED" : "IN REVIEW"}</div><h3>{show.title}</h3><p>{show.description}</p>{mine && <button className="podcastAddEpisode" type="button" onClick={() => {setEpisodeShow(show.id);setEpisodeDraft(blankEpisode);}}>＋ Add episode</button>}<div className="podcastEpisodes">{show.episodes.map(episode => <div className="podcastEpisode" key={episode.id}><div><b>{episode.title}</b><small>{episode.status === "published" ? "Published episode" : "Pending review"}</small>{episode.description && <p>{episode.description}</p>}</div>{episode.status === "published" || mine ? <audio controls preload="none" src={episode.audioUrl}>Audio playback is not supported.</audio> : null}</div>)}{show.episodes.length === 0 && <small>No episodes published yet.</small>}</div></div></article>)}</div>}
      {!loading && !error && visible.length === 0 && <div className="podcastsEmpty">{mine ? "You have not created a podcast yet. Start your first show above." : "No published podcasts match your search yet. Be the first to create a show."}</div>}
    </section>
    <section className="podcastsPolicy"><b>Creator publishing and rights</b><p>Only upload audio you created or are authorized to distribute. Do not upload unlawful, infringing, hateful, harassing, or otherwise prohibited material. New shows and episodes remain private while pending moderator review.</p></section>
    <footer className="podcastsFooter">Connect Podcasts · Your voice. Your audience. Your Connect. · Adults 18+</footer>
  </main>;
}
