import Link from "next/link";

const featuredChannels = [
  { id: "sky-uk", name: "Sky News", country: "United Kingdom", language: "English", flag: "🇬🇧" },
  { id: "abc-us", name: "ABC News Live", country: "United States", language: "English", flag: "🇺🇸" },
  { id: "f24-fr", name: "France 24", country: "France", language: "English", flag: "🇫🇷" },
  { id: "aljazeera-global", name: "Al Jazeera English", country: "Global", language: "English", flag: "🌍" },
];

export default function FeaturedTvChannels() {
  return (
    <section className="ctHomeTv" aria-labelledby="ct-home-tv-title">
      <div className="ctHomeTvIntro">
        <span>CONNECT · LIVE TV</span>
        <h2 id="ct-home-tv-title">Watch the world as it happens.</h2>
        <p>Choose an official broadcaster to load its live video stream. Coverage and embedding availability may vary by country and time.</p>
      </div>
      <div className="ctHomeTvGrid">
        {featuredChannels.map((channel) => (
          <article className="ctHomeTvCard" key={channel.id}>
            <span className="ctHomeTvFlag" aria-hidden="true">{channel.flag}</span>
            <div className="ctHomeTvDetails">
              <strong>{channel.name}</strong>
              <small>{channel.country} · {channel.language}</small>
            </div>
            <Link href={`/free-tv?channel=${channel.id}#live-player`} aria-label={`Watch ${channel.name} live`}>Watch live <span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </div>
      <Link className="ctHomeTvAll" href="/free-tv">Browse all official TV channels →</Link>
    </section>
  );
}
