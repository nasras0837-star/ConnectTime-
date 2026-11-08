"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Station = {
  id: string;
  name: string;
  country: string;
  language: string;
  tags: string;
  codec: string;
  bitrate: number;
};

export default function RadioStationFinder() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [query, setQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState("");
  const [playingName, setPlayingName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchStations(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const params = new URLSearchParams({ limit: "8", sort: "clickcount" });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch("/api/radio?" + params.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Radio search is temporarily unavailable.");
      const results = Array.isArray(data.stations) ? data.stations as Station[] : [];
      setStations(results);
      if (!results.length) setNotice("No matching stations found. Try another station name, country or genre.");
    } catch (cause) {
      setStations([]);
      setError(cause instanceof Error ? cause.message : "Could not search radio stations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void searchStations();
  }, []);

  async function playStation(station: Station) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === station.id && !audio.paused) {
      audio.pause();
      return;
    }
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/radio/listen?uuid=" + encodeURIComponent(station.id), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") {
        throw new Error(data.error || "This station could not be started. Try another station.");
      }
      audio.src = data.url;
      audio.load();
      await audio.play();
      setPlayingId(station.id);
      setPlayingName(station.name);
    } catch (cause) {
      setPlayingId("");
      setPlayingName("");
      setError(cause instanceof Error ? cause.message : "Playback failed. Please choose another station.");
    }
  }

  return (
    <section className="ctRadioFinder" aria-labelledby="ctRadioFinderTitle">
      <div className="ctRadioFinderTop">
        <div>
          <span className="ctRadioFinderEyebrow">CONNECTTIME RADIO</span>
          <h2 id="ctRadioFinderTitle">Find a station. <em>Press play.</em></h2>
          <p>Search internet radio from around the world and listen right here on the homepage.</p>
        </div>
        <div className="ctRadioFinderIcon" aria-hidden="true">♫</div>
      </div>
      <form className="ctRadioFinderSearch" onSubmit={searchStations}>
        <label className="sr-only" htmlFor="ct-radio-search">Search radio stations</label>
        <span aria-hidden="true">⌕</span>
        <input id="ct-radio-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search station, country or music genre…" maxLength={100} />
        <button type="submit" disabled={loading}>{loading ? "Searching…" : "Search stations"}</button>
      </form>
      <div className="ctRadioFinderResults" aria-live="polite">
        {stations.map(station => (
          <article className={playingId === station.id ? "ctRadioStation isPlaying" : "ctRadioStation"} key={station.id}>
            <div className="ctRadioStationMark" aria-hidden="true">♫</div>
            <div className="ctRadioStationDetails">
              <strong>{station.name}</strong>
              <span>{[station.country, station.language, station.tags.split(",").slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Internet radio"}</span>
            </div>
            <button type="button" className="ctRadioPlayButton" onClick={() => void playStation(station)} aria-label={playingId === station.id ? "Pause " + station.name : "Play " + station.name}>
              {playingId === station.id && audioRef.current && !audioRef.current.paused ? "Ⅱ" : "▶"}
            </button>
          </article>
        ))}
        {!loading && !stations.length && !error && <p className="ctRadioFinderEmpty">{notice || "Loading stations…"}</p>}
      </div>
      {error && <p className="ctRadioFinderError" role="alert">{error}</p>}
      {notice && stations.length > 0 && <p className="ctRadioFinderNotice">{notice}</p>}
      <div className="ctRadioNowPlaying">
        <div><small>NOW PLAYING</small><strong>{playingName || "Choose a station to start listening"}</strong></div>
        <audio ref={audioRef} controls preload="none" aria-label="ConnectTime radio audio player" onPause={() => setPlayingId("")} onPlay={() => setError("")} onError={() => { setPlayingId(""); setError("The stream stopped or is unavailable. Try another station."); }} />
      </div>
      <a className="ctRadioBrowseLink" href="/radio">Browse the full worldwide radio directory <span aria-hidden="true">→</span></a>
      <small className="ctRadioFinderDisclaimer">Station streams are supplied by broadcasters and may vary by region or availability.</small>
    </section>
  );
}
