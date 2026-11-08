"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Station = { id:string; name:string; country:string; countryCode:string; language:string; tags:string; codec:string; bitrate:number; homepage:string; streamUrl:string; votes:number };
const regions = [
 {name:"Africa",codes:["DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW"]},
 {name:"Asia",codes:["AF","AM","AZ","BH","BD","BT","BN","KH","CN","CY","GE","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP","KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH","TL","TR","TM","AE","UZ","VN","YE"]},
 {name:"Europe",codes:["AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE","CH","UA","GB","VA"]},
 {name:"North America",codes:["AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN","JM","MX","NI","PA","KN","LC","VC","TT","US"]},
 {name:"South America",codes:["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"]},
 {name:"Oceania",codes:["AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"]}
];
const languages=["Arabic","Bengali","Chinese","English","French","German","Hindi","Indonesian","Italian","Japanese","Korean","Portuguese","Russian","Spanish","Swahili","Tamil","Thai","Turkish","Urdu","Vietnamese"];

export default function RadioPage(){
 const audioRef=useRef<HTMLAudioElement>(null);
 const [region,setRegion]=useState("All regions"),[country,setCountry]=useState(""),[language,setLanguage]=useState(""),[query,setQuery]=useState(""),[sort,setSort]=useState("clickcount");
 const [stations,setStations]=useState<Station[]>([]),[favoriteStations,setFavoriteStations]=useState<Station[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[playing,setPlaying]=useState<string|null>(null),[playingName,setPlayingName]=useState(""),[streamUrl,setStreamUrl]=useState(""),[loadingId,setLoadingId]=useState("");
 const [saved,setSaved]=useState<string[]>([]),[savedOnly,setSavedOnly]=useState(false),[favoritesLoaded,setFavoritesLoaded]=useState(false);
 const [favoritesError,setFavoritesError]=useState(""),[favoriteRetry,setFavoriteRetry]=useState(0),[favoritesLoading,setFavoritesLoading]=useState(false);
 const countryOptions=useMemo(()=>region==="All regions"?Array.from(new Set(regions.flatMap(item=>item.codes))).sort():regions.find(item=>item.name===region)?.codes||[],[region]);
 const countryNames=useMemo(()=>new Intl.DisplayNames(["en"],{type:"region"}),[]);

 const search=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const p=new URLSearchParams({limit:"100",sort});
   if(country)p.set("country",country);if(language)p.set("language",language);if(query.trim())p.set("q",query.trim());
   const res=await fetch("/api/radio?"+p.toString(),{cache:"no-store"});const data=await res.json();
   if(!res.ok)throw new Error(data.error||"Could not load stations");
   setStations(Array.isArray(data.stations)?data.stations:[]);
  }catch(e){setError(e instanceof Error?e.message:"Radio search failed");setStations([]);}
  finally{setLoading(false);}
 },[country,language,query,sort]);

 useEffect(()=>{const timer=window.setTimeout(()=>{void search();},350);return()=>window.clearTimeout(timer);},[search]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(!active)return;try{const raw=window.localStorage.getItem("connecttime-radio-favorites");if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setSaved(parsed.filter((id):id is string=>typeof id==="string").slice(0,500));}}catch{/* Browser storage may be unavailable. */}finally{if(active)setFavoritesLoaded(true);}});return()=>{active=false;}},[]);
 useEffect(()=>{if(!favoritesLoaded)return;try{window.localStorage.setItem("connecttime-radio-favorites",JSON.stringify(saved));}catch{/* Favorites remain available for this session. */}},[saved,favoritesLoaded]);

 useEffect(()=>{
  if(!savedOnly||saved.length===0)return;
  let active=true;
  setFavoritesError("");
  setFavoritesLoading(true);
  const loadFavorites=async()=>{
   try{
    const batches=Array.from({length:Math.ceil(saved.length/100)},(_,index)=>saved.slice(index*100,(index+1)*100));
    const results=await Promise.all(batches.map(async ids=>{
     const response=await fetch("/api/radio?ids="+encodeURIComponent(ids.join(",")),{cache:"no-store"});
     const data=await response.json();
     if(!response.ok)throw new Error(data.error||"Could not load saved stations");
     return Array.isArray(data.stations)?data.stations as Station[]:[];
    }));
    if(active)setFavoriteStations(results.flat());
   }catch(error){if(active){setFavoriteStations([]);setFavoritesError(error instanceof Error?error.message:"Could not load saved stations");}}
   finally{if(active)setFavoritesLoading(false);}
  };
  void loadFavorites();
  return()=>{active=false;};
 },[saved,savedOnly,favoriteRetry]);

 useEffect(()=>{
  const audio=audioRef.current;
  if(!audio||!streamUrl)return;
  audio.src=streamUrl;
  void audio.play().catch(()=>setError("This station did not start automatically. Press Play in the player controls or choose another station."));
 },[streamUrl]);

 const sourceList=savedOnly?favoriteStations:stations;
 const list=useMemo(()=>{
  const regionCodes=regions.find(r=>r.name===region)?.codes||[];
  const term=query.trim().toLowerCase();
  const filtered=sourceList.filter(s=>
   (region==="All regions"||regionCodes.includes(s.countryCode))&&
   (!country||s.countryCode===country)&&
   (!language||s.language.toLowerCase().split(/[;,]/).some(value=>value.trim()===language.toLowerCase()))&&
   (!term||[s.name,s.country,s.language,s.tags].join(" ").toLowerCase().includes(term))
  );
  if(savedOnly){
   if(sort==="name")filtered.sort((a,b)=>a.name.localeCompare(b.name));
   if(sort==="votes")filtered.sort((a,b)=>b.votes-a.votes);
   if(sort==="bitrate")filtered.sort((a,b)=>b.bitrate-a.bitrate);
   if(sort==="clickcount")filtered.sort((a,b)=>b.votes-a.votes);
  }
  return filtered;
 },[sourceList,region,country,language,query,savedOnly,sort]);

 async function playStation(station:Station){
  if(playing===station.id){audioRef.current?.pause();return;}
  setLoadingId(station.id);setError("");
  try{
   const res=await fetch("/api/radio/listen?uuid="+encodeURIComponent(station.id),{cache:"no-store"});
   const data=await res.json();if(!res.ok||typeof data.url!=="string")throw new Error(data.error||"This station could not be started.");
   setPlayingName(station.name);setPlaying(station.id);setStreamUrl(data.url);
  }catch(e){setError(e instanceof Error?e.message:"This station could not be started.");}
  finally{setLoadingId("");}
 }
 function toggleSave(id:string){setSaved(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}

 return <main className="radioPage">
  <header className="radioHeader"><Link href="/" className="radioBrand" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={44} height={44} priority/><span>ConnectTime</span></Link><nav><Link href="/free-tv">Free TV</Link><Link href="/videos">Video Tube</Link><Link href="/">Home</Link><Link href="/register">Register Now</Link></nav></header>
  <section className="radioHero"><span>CONNECTTIME · FREE RADIO</span><h1>Your world.<br/><em>Your sound.</em></h1><p>Explore thousands of free internet radio stations from countries and communities across every region. Tune in through the station&apos;s own stream—music, local radio, culture, news and more.</p><div><span>🌍 Worldwide station directory</span><span>🎵 Music & genres</span><span>📻 Local radio voices</span><span>🔊 Free streams</span></div></section>
  <section className="radioMain">
   <div className="radioHeading"><div><span>LIVE RADIO DIRECTORY</span><h2>Find your frequency</h2><p>Powered by Radio Browser&apos;s community-maintained station listings. Streams and licensing are provided by broadcasters, not ConnectTime.</p></div><button onClick={()=>{setLoading(true);void search();}} disabled={loading}>{loading?"Searching…":"↻ Refresh"}</button></div>
   <div className="radioPlayerBar"><div className="radioPlayerDisc">♫</div><div className="radioPlayerInfo"><small>NOW PLAYING</small><strong>{playingName||"Choose a station to start listening"}</strong><span>{playingName?"Live internet radio stream":"One player keeps your listening in one place."}</span></div><audio ref={audioRef} controls preload="none" onPlay={()=>setError("")} onPause={()=>setPlaying(null)} onError={()=>{if(streamUrl)setError("This stream stopped or could not be decoded. Try another station.");}} aria-label="ConnectTime radio player">Your browser does not support audio playback.</audio></div>
   <div className="radioFilters"><label>Region<select value={region} onChange={e=>{setRegion(e.target.value);setCountry("");}}><option>All regions</option>{regions.map(r=><option key={r.name}>{r.name}</option>)}</select></label><label>Country<select value={country} onChange={e=>setCountry(e.target.value)}><option value="">All countries</option>{countryOptions.map(code=><option value={code} key={code}>{countryNames.of(code)||code}</option>)}</select></label><label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="">All languages</option>{languages.map(l=><option key={l}>{l}</option>)}</select></label><label>Sort stations<select value={sort} onChange={e=>setSort(e.target.value)}><option value="clickcount">Most listened</option><option value="votes">Community favorites</option><option value="bitrate">Highest bitrate</option><option value="name">Alphabetical</option></select></label><label className="radioSearch">Station / genre<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search jazz, reggae, news…"/></label></div>
   <div className="radioToolbar"><button onClick={()=>setSavedOnly(false)} aria-pressed={!savedOnly}>All results ({stations.length})</button><button onClick={()=>setSavedOnly(true)} aria-pressed={savedOnly}>★ Favorites ({saved.length})</button><span className="radioResultCount" role="status" aria-live="polite">{savedOnly?favoriteStations.length+" saved stations loaded":list.length+" stations shown"}</span><button className="radioReset" type="button" onClick={()=>{setRegion("All regions");setCountry("");setLanguage("");setQuery("");setSort("clickcount");setSavedOnly(false);}}>Reset filters</button><small>{favoritesLoaded?"Favorites saved on this device":"Loading favorites…"}</small></div>
   {error&&<div className="radioAlert" role="alert">{error} <button onClick={()=>{setLoading(true);void search();}}>Retry</button></div>}
   {loading&&!savedOnly&&<div className="radioEmpty" role="status">Finding stations around the world…</div>}
   {savedOnly&&saved.length===0&&<div className="radioEmpty">You have not saved any stations yet. Switch to All results and tap ☆ to save a station.</div>}
   {((!loading&&!savedOnly)||(savedOnly&&saved.length>0&&favoriteStations.length>0))&&<div className="radioGrid">{list.map(s=><article className={playing===s.id?"radioCard isPlaying":"radioCard"} key={s.id}><div className="radioCardTop"><span>📻 {s.country||"International"}</span><button aria-label={saved.includes(s.id)?"Remove favorite":"Save favorite"} onClick={()=>toggleSave(s.id)}>{saved.includes(s.id)?"★":"☆"}</button></div><h3>{s.name}</h3><p>{[s.language,s.tags].filter(Boolean).join(" · ")||"Radio station"}</p><div className="radioMeta">{s.codec||"Stream"}{s.bitrate?" · "+s.bitrate+" kbps":""}{s.votes?" · "+s.votes+" community votes":""}</div><button className="radioListenButton" onClick={()=>void playStation(s)} disabled={loadingId===s.id}>{loadingId===s.id?"Connecting…":playing===s.id?"Ⅱ Pause":"▶ Listen live"}</button>{s.homepage&&<div className="radioLinks"><a href={s.homepage} target="_blank" rel="noopener noreferrer">Station website ↗</a></div>}</article>)}</div>}
   {savedOnly&&saved.length>0&&favoriteStations.length===0&&<div className="radioEmpty" role="status">{favoritesLoading?"Loading your saved stations…":favoritesError?<>Saved stations could not be loaded. <button type="button" onClick={()=>setFavoriteRetry(value=>value+1)}>Retry loading favorites</button></>:"Your saved stations are no longer available in the directory."}</div>}
   {savedOnly&&!favoritesLoading&&!favoritesError&&favoriteStations.length>0&&list.length===0&&<div className="radioEmpty" role="status">No saved stations match these filters. <button type="button" onClick={()=>{setRegion("All regions");setCountry("");setLanguage("");setQuery("");setSort("clickcount");}}>Clear filters</button></div>}
   {!loading&&!savedOnly&&!error&&list.length===0&&<div className="radioEmpty">No stations found. Try another country, language or genre.</div>}
   <p className="radioRights">Station availability, stream reliability, advertisements, content and music licensing are controlled by each broadcaster. ConnectTime links to publicly listed streams and does not own, rebroadcast, or guarantee rights to station content. Some stations may be unavailable in certain countries.</p>
  </section>
  <section className="radioFreeMusic"><div><span>FREE MUSIC DISCOVERY</span><h2>Find music, not just radio.</h2><p>Discover free, legal listening and artist-supported music services. Catalogs, account requirements and geographic availability vary.</p></div><div className="radioMusicLinks"><a href="https://www.jamendo.com/" target="_blank" rel="noopener noreferrer"><b>Jamendo</b><small>Independent artists · free listening options</small>↗</a><a href="https://soundcloud.com/" target="_blank" rel="noopener noreferrer"><b>SoundCloud</b><small>Artist uploads · free tracks and mixes</small>↗</a><a href="https://bandcamp.com/" target="_blank" rel="noopener noreferrer"><b>Bandcamp</b><small>Artist-first discovery · some free releases</small>↗</a><a href="https://freemusicarchive.org/" target="_blank" rel="noopener noreferrer"><b>Free Music Archive</b><small>Curated music · license terms per track</small>↗</a></div></section>
  <footer className="radioFooter">© {new Date().getFullYear()} Techcyber LLC · ConnectTime · <Link href="/safety">Safety</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link></footer>
 </main>;
}
