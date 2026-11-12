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
  const [playbackError, setPlaybackError] = useState("");

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
    <>
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
            onClick={() => { setSelected(station); setPlaybackError(""); }}
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
          <audio key={selected.id} controls preload="none" src={selected.streamUrl} aria-label={"Listen to " + selected.name} onError={() => setPlaybackError("This station stream is unavailable. Please choose another station.")}>
            Your browser does not support audio playback.
          </audio>
          {playbackError && <small className="homeRadioError" role="status">{playbackError}</small>}
        </div>
      )}
      <div className="homeRadioFooter">
        <span>Free public station streams</span>
        <Link href="/radio">Explore all stations ↗</Link>
      </div>
    </section>
    <style jsx>{`
      .homeRadioCard{background:#fff;border:1px solid #e3eaf2;border-radius:16px;padding:14px;box-shadow:0 8px 22px #1d42610b;min-width:0}
      .homeRadioHeading{display:flex;align-items:center;gap:10px;margin-bottom:12px}
      .homeRadioIcon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#e7f6fb;font-size:19px}
      .homeRadioHeading strong{display:block;font-size:14px;color:#18364b}
      .homeRadioHeading small{display:block;color:#8292a0;font-size:10px;margin-top:2px}
      .homeRadioLive{margin-left:auto;border-radius:20px;padding:4px 7px;background:#e8f8f1;color:#178b67;font-size:9px;font-weight:900;letter-spacing:.6px}
      .homeRadioSearch{display:flex;align-items:center;gap:7px;border:1px solid #dce7ef;background:#f8fbfd;border-radius:10px;padding:0 10px;height:38px;color:#77909f}
      .homeRadioSearch input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#234458;font:inherit;font-size:11px}
      .homeRadioSearch input::placeholder{color:#92a2ae}
      .homeRadioResults{display:grid;gap:4px;margin-top:8px}
      .homeRadioStation{display:flex;align-items:center;gap:9px;text-align:left;border:0;border-radius:9px;background:transparent;padding:7px 6px;cursor:pointer;min-width:0;color:#254357;width:100%}
      .homeRadioStation:hover,.homeRadioStation.selected{background:#eef8fb}
      .homeRadioPlay{flex:0 0 25px;width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#e6f3fa;color:#087eae;font-size:10px}
      .homeRadioStationText{min-width:0}
      .homeRadioStationText strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
      .homeRadioStationText small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8797a3;font-size:9px;margin-top:2px}
      .homeRadioHint,.homeRadioError{display:block;padding:8px 4px;color:#8797a3;font-size:10px}
      .homeRadioError{color:#b54747}
      .homeRadioPlayer{margin-top:9px;padding:9px;border-radius:10px;background:#f1f8fb}
      .homeRadioNow span{display:block;color:#168b82;font-size:8px;font-weight:900;letter-spacing:.8px}
      .homeRadioNow strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#24475b;font-size:10px;margin:3px 0 6px}
      .homeRadioPlayer audio{display:block;width:100%;height:30px}
      .homeRadioFooter{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:9px;border-top:1px solid #edf1f4}
      .homeRadioFooter span{color:#91a0aa;font-size:9px}
      .homeRadioFooter a{color:#087fae;font-size:10px;font-weight:800;white-space:nowrap}
      @media(max-width:760px){.homeRadioCard{padding:12px}.homeRadioStation{padding:8px 5px}}
    `}</style>
    </>
  );
