"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type EventItem = { id?: string; title: string; category: string; date: string; time: string; city: string; country: string; venue: string; description: string; price: string; host: string; emoji: string };
const categories = ["All events", "Community & social", "Music & nightlife", "Sports & outdoors", "Markets & food", "Arts & culture", "Business & learning", "Family-friendly"];
const emptyForm = { title: "", category: "Community & social", date: "", time: "", city: "", country: "", venue: "", price: "Free", description: "", host: "" };

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [category, setCategory] = useState("All events");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const today = new Date();
  const minimumEventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const loadEvents = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (category !== "All events") params.set("category", category);
      const response = await fetch(`/api/events?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load events.");
      setEvents(data.events || []); setSignedIn(true);
    } catch (e) {
      setEvents([]); setSignedIn(false);
      setError(e instanceof Error ? e.message : "Unable to load events.");
    } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);
  const visible = useMemo(() => events.filter(event => [event.title, event.city, event.country, event.venue, event.description, event.host].join(" ").toLowerCase().includes(query.toLowerCase())), [events, query]);
  function update(field: keyof typeof form, value: string) { setForm(current => ({ ...current, [field]: value })); }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Event submission failed.");
      setNotice(data.message || "Your event has been submitted for review.");
      setForm(emptyForm); setShowForm(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Event submission failed."); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="eventsPage">
      <header className="eventsHeader"><Link href="/" className="eventsBrand" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={150} height={98} priority className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/videos">ConnectTime TV</Link><Link href="/signup" className="eventsJoin">Join free ↗</Link></nav></header>
      <section className="eventsHero"><span className="eventsEyebrow">YOUR CITY. YOUR COMMUNITY. YOUR MOMENT.</span><h1>Make plans.<br/><em>Meet the world.</em></h1><p>Discover what's happening near you, find events in places you dream of visiting, and bring people together around something you love.</p><div className="eventsHeroActions"><button type="button" onClick={() => { setShowForm(true); setNotice(""); }}>＋ Promote an event</button><a href="#discover-events">Explore events ↓</a></div><div className="eventsPills"><span>📍 Local meetups</span><span>🎵 Music & culture</span><span>🤝 Community gatherings</span><span>🌎 Across the globe</span></div></section>
      <section className="eventsMain" id="discover-events">
        <p className="eventsPreviewNotice" role="note">Member event directory. Events submitted by members remain private until reviewed and approved by moderators. Sign in with an independently verified adult account to browse.</p>
        <div className="eventsSectionHead"><div><span>FIND YOUR NEXT EXPERIENCE</span><h2>Events around the world</h2><p>Search by event, city, country, or venue.</p></div><button type="button" onClick={() => { setShowForm(true); setNotice(""); }}>＋ Add your event</button></div>
        <div className="eventsSearch"><span>⌕</span><input aria-label="Search events or places" placeholder="Try “live music”, “Miami”, or “London”…" value={query} onChange={e => setQuery(e.target.value)}/></div>
        <div className="eventsCategories" role="group" aria-label="Filter events by category">{categories.map(item => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {notice && <div className="eventSuccess" role="status">{notice}</div>}
        {error && <div className="eventsEmpty" role="alert">{error} <Link href="/login">Sign in</Link> or <button type="button" onClick={() => void loadEvents()}>try again</button>.</div>}
        {showForm && <div className="eventFormPanel" id="promote-event"><div className="eventFormHeading"><div><span>SHARE SOMETHING HAPPENING</span><h2>Promote your event</h2><p>Submissions go to moderation before they become visible.</p></div><button type="button" aria-label="Close event form" onClick={() => setShowForm(false)}>×</button></div>
          <form onSubmit={submitEvent} className="eventForm">
            <label>Event name<input required maxLength={90} value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Community food festival"/></label>
            <label>Category<select value={form.category} onChange={e => update("category", e.target.value)}>{categories.slice(1).map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Date<input required type="date" min={minimumEventDate} value={form.date} onChange={e => update("date", e.target.value)}/></label>
            <label>Start time<input required type="time" value={form.time} onChange={e => update("time", e.target.value)}/></label>
            <label>City<input required maxLength={70} value={form.city} onChange={e => update("city", e.target.value)} placeholder="City"/></label>
            <label>Country<input required maxLength={70} value={form.country} onChange={e => update("country", e.target.value)} placeholder="Country"/></label>
            <label className="eventWide">Venue or meeting point<input required maxLength={120} value={form.venue} onChange={e => update("venue", e.target.value)} placeholder="Venue name or public meeting point"/></label>
            <label>Entry<select value={form.price} onChange={e => update("price", e.target.value)}><option>Free</option><option>Free entry</option><option>Ticketed</option><option>Contact host</option></select></label>
            <label>Organizer / host<input required maxLength={70} value={form.host} onChange={e => update("host", e.target.value)} placeholder="Your name or group"/></label>
            <label className="eventWide">Event details<textarea required maxLength={600} rows={4} value={form.description} onChange={e => update("description", e.target.value)} placeholder="What can people expect? Who should come? Any helpful details?"/></label>
            <div className="eventFormFoot"><small>Submitting does not publish your event immediately. Moderators review listings before public discovery.</small><button type="submit" disabled={submitting || !signedIn}>{submitting ? "Submitting…" : "Submit for review ↗"}</button></div>
          </form></div>}
        {loading ? <div className="eventsEmpty" role="status">Loading approved events…</div> : !error && <div className="eventGrid">{visible.map(event => <article className="eventCard" key={event.id}><div className="eventArtwork"><span>{event.emoji || "📅"}</span><small>{event.category}</small></div><div className="eventCardBody"><div className="eventDate">{new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.time}</div><h3>{event.title}</h3><p>{event.description}</p><div className="eventPlace">📍 {event.venue}, {event.city}, {event.country}</div><div className="eventCardFoot"><span>{event.price}</span><small>Hosted by {event.host}</small></div><Link href="/login">Sign in to connect ↗</Link></div></article>)}</div>}
        {!loading && !error && visible.length === 0 && <div className="eventsEmpty">No approved events match that search yet. Try another place or category—or submit an event for review.</div>}
      </section>
      <section className="eventsHostCta"><div><span>BRING PEOPLE TOGETHER</span><h2>Have something happening?</h2><p>From a neighborhood meetup to a festival, workshop, game night, or cultural celebration—give your event a place to be discovered.</p></div><button type="button" onClick={() => { setShowForm(true); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Promote your event ↗</button></section>
      <footer className="eventsFooter">ConnectTime Events · Discover locally. Connect globally. · Adults 18+</footer>
    </main>
  );
}
