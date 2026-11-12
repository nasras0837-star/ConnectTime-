"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Station = {
  id: string;
  name: string;
  country: string;
  language: string;
  tags: string;
  streamUrl: string;
  bitrate: number;
};

export default function HomeRadioSearch() {
  const [query, setQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "8", sort: "clickcount" });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch("/api/radio?" + params.toString(), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Radio search is unavailable.");
        if (active) {
          const nextStations: Station[] = data.stations || [];
          setStations(nextStations);
          setSelected((current) => current && nextStations.some((station) => station.id === current.id) ? current : null);
        }
      } catch (reason) {
        if (active) {
          setStations([]);
          setError(reason instanceof Error ? reason.message : "Could not search radio stations.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 350 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="homeRadioCard" aria-label="World radio station search">
      <div className="homeRadioHeading">
        <span className="homeRadioIcon" aria-hidden="true">📻</span>
        <div><strong>World Radio</strong><small>Stations from around the globe</small></div>
        <span className="homeRadioLive">LIVE</span>
      </div>
      <label className="homeRadioSearch">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any station, country or genre"
          aria-label="Search radio stations worldwide"
        />
      </label>
      <div className="homeRadioResults" aria-live="polite">
        {loading && <small className="homeRadioHint">Finding stations…</small>}
        {!loading && error && <small className="homeRadioError">{error}</small>}
        {!loading && !error && stations.length === 0 && <small className="homeRadioHint">No stations found. Try another search.</small>}
        {!loading && !error && stations.slice(0, 5).map((station) => (
          <button
            type="button"
            className={"homeRadioStation" + (selected?.id === station.id ? " selected" : "")}
            key={station.id}
            onClick={() => setSelected(station)}
            title={"Play " + station.name}
          >
            <span className="homeRadioPlay" aria-hidden="true">{selected?.id === station.id ? "♫" : "▶"}</span>
            <span className="homeRadioStationText"><strong>{station.name}</strong><small>{[station.country, station.tags.split(",").slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Worldwide station"}</small></span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="homeRadioPlayer">
          <div className="homeRadioNow"><span>NOW PLAYING</span><strong>{selected.name}</strong></div>
          <audio key={selected.id} controls preload="none" src={selected.streamUrl} aria-label={"Listen to " + selected.name}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}
      <div className="homeRadioFooter">
        <span>Free public station streams</span>
        <Link href="/radio">Explore all stations ↗</Link>
      </div>
    </section>
  );
}
