"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type EventItem = { title: string; category: string; date: string; time: string; city: string; country: string; venue: string; description: string; price: string; host: string; emoji: string };

const sampleEvents: EventItem[] = [
  { title: "Sunset beach volleyball", category: "Sports & outdoors", date: "2026-11-14", time: "16:30", city: "Miami", country: "United States", venue: "South Beach", description: "Meet new people, enjoy a friendly game, and watch the sunset together.", price: "Free", host: "Miami Outdoor Crew", emoji: "🏐" },
  { title: "Creative minds coffee meetup", category: "Community & social", date: "2026-11-16", time: "10:00", city: "London", country: "United Kingdom", venue: "Shoreditch", description: "A relaxed morning for artists, makers, and curious people to connect.", price: "Free", host: "Creative Corner", emoji: "☕" },
  { title: "Afrobeats dance night", category: "Music & nightlife", date: "2026-11-20", time: "20:00", city: "Lagos", country: "Nigeria", venue: "Victoria Island", description: "Celebrate music, movement, and culture with the community.", price: "Ticketed", host: "Lagos Dance Collective", emoji: "🎶" },
  { title: "Weekend makers market", category: "Markets & food", date: "2026-11-21", time: "11:00", city: "Toronto", country: "Canada", venue: "Distillery District", description: "Discover independent makers, handmade goods, and local food.", price: "Free entry", host: "Toronto Makers", emoji: "🛍️" },
];

const categories = ["All events", "Community & social", "Music & nightlife", "Sports & outdoors", "Markets & food", "Arts & culture", "Business & learning", "Family-friendly"];

export default function EventsPage() {
  const [events, setEvents] = useState(sampleEvents);
  const today = new Date();
  const minimumEventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [category, setCategory] = useState("All events");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Community & social", date: "", time: "", city: "", country: "", venue: "", price: "Free", description: "", host: "" });

  const visible = useMemo(() => events.filter((event) => {
    const matchesCategory = category === "All events" || event.category === category;
    const isUpcoming = event.date >= minimumEventDate;
    const haystack = [event.title, event.city, event.country, event.venue, event.description, event.host].join(" ").toLowerCase();
    return isUpcoming && matchesCategory && haystack.includes(query.toLowerCase());
  }), [events, category, query]);

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  function addPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { ...form, emoji: "📅" };
    setEvents((current) => [next, ...current]);
    setCategory("All events");
    setQuery("");
    setShowForm(false);
    setSubmitted(true);
    setForm({ title: "", category: "Community & social", date: "", time: "", city: "", country: "", venue: "", price: "Free", description: "", host: "" });
  }

  return (
    <main className="eventsPage">
      <header className="eventsHeader"><Link href="/" className="eventsBrand" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={150} height={98} priority className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/videos">ConnectTime TV</Link><Link href="/signup" className="eventsJoin">Join free ↗</Link></nav></header>
      <section className="eventsHero">
        <span className="eventsEyebrow">YOUR CITY. YOUR COMMUNITY. YOUR MOMENT.</span>
        <h1>Make plans.<br/><em>Meet the world.</em></h1>
        <p>Discover what’s happening near you, find events in places you dream of visiting, and bring people together around something you love.</p>
        <div className="eventsHeroActions"><button type="button" onClick={() => { setShowForm(true); setSubmitted(false); }}>＋ Promote an event</button><a href="#discover-events">Explore events ↓</a></div>
        <div className="eventsPills"><span>📍 Local meetups</span><span>🎵 Music & culture</span><span>🤝 Community gatherings</span><span>🌎 Across the globe</span></div>
      </section>
      <section className="eventsMain" id="discover-events">
        <p className="eventsPreviewNotice" role="note">Preview directory: sample listings are illustrative and are not verified or confirmed events. Event submissions are temporary page previews and are not published publicly.</p>
        <div className="eventsSectionHead"><div><span>FIND YOUR NEXT EXPERIENCE</span><h2>Events around the world</h2><p>Search by event, city, country, or venue.</p></div><button type="button" onClick={() => { setShowForm(true); setSubmitted(false); }}>＋ Add your event</button></div>
        <div className="eventsSearch"><span>⌕</span><input aria-label="Search events or places" placeholder="Try “live music”, “Miami”, or “London”…" value={query} onChange={(e) => setQuery(e.target.value)}/></div>
        <div className="eventsCategories" role="group" aria-label="Filter events by category">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {submitted && <div className="eventSuccess" role="status">✨ Your event preview has been added to this page. Sign in and connect the publishing service to share it with everyone.</div>}
        {showForm && <div className="eventFormPanel" id="promote-event">
          <div className="eventFormHeading"><div><span>SHARE SOMETHING HAPPENING</span><h2>Promote your event</h2><p>Tell the community what, where, and when. Make it easy for people nearby to find you.</p></div><button type="button" aria-label="Close event form" onClick={() => setShowForm(false)}>×</button></div>
          <form onSubmit={addPreview} className="eventForm">
            <label>Event name<input required maxLength={90} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Community food festival"/></label>
            <label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Date<input required type="date" min={minimumEventDate} value={form.date} onChange={(e) => update("date", e.target.value)}/></label>
            <label>Start time<input required type="time" value={form.time} onChange={(e) => update("time", e.target.value)}/></label>
            <label>City<input required maxLength={70} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City"/></label>
            <label>Country<input required maxLength={70} value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Country"/></label>
            <label className="eventWide">Venue or meeting point<input required maxLength={120} value={form.venue} onChange={(e) => update("venue", e.target.value)} placeholder="Venue name or public meeting point"/></label>
            <label>Entry<select value={form.price} onChange={(e) => update("price", e.target.value)}><option>Free</option><option>Free entry</option><option>Ticketed</option><option>Contact host</option></select></label>
            <label>Organizer / host<input required maxLength={70} value={form.host} onChange={(e) => update("host", e.target.value)} placeholder="Your name or group"/></label>
            <label className="eventWide">Event details<textarea required maxLength={600} rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What can people expect? Who should come? Any helpful details?"/></label>
            <div className="eventFormFoot"><small>Preview only: publishing, ticket payments, event image uploads, and attendee management will be connected when the platform backend is ready.</small><button type="submit">Create event preview ↗</button></div>
          </form>
        </div>}
        <div className="eventGrid">{visible.map((event, index) => <article className="eventCard" key={event.title + event.city + index}><div className="eventArtwork"><span>{event.emoji}</span><small>{event.category}</small></div><div className="eventCardBody"><div className="eventDate">{new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.time}</div><h3>{event.title}</h3><p>{event.description}</p><div className="eventPlace">📍 {event.venue}, {event.city}, {event.country}</div><div className="eventCardFoot"><span>{event.price}</span><small>Hosted by {event.host}</small></div><Link href="/signup">Connect to attend ↗</Link></div></article>)}</div>
        {visible.length === 0 && <div className="eventsEmpty">No events match that search yet. Try another place or category—or be the first to add one!</div>}
      </section>
      <section className="eventsHostCta"><div><span>BRING PEOPLE TOGETHER</span><h2>Have something happening?</h2><p>From a neighborhood meetup to a festival, workshop, game night, or cultural celebration—give your event a place to be discovered.</p></div><button type="button" onClick={() => { setShowForm(true); setSubmitted(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Promote your event ↗</button></section>
      <footer className="eventsFooter">ConnectTime Events · Discover locally. Connect globally. · Adults 18+</footer>
    </main>
  );
}
