"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Article={id:string;title:string;link:string;description:string;publishedAt:string;source:string;category:string;image?:string};
const topics=["For You","Nearby","World","Politics","Sports","Music","Entertainment","Business","Technology"];
export default function LiveNewsWidget(){
 const [topic,setTopic]=useState("For You"),[articles,setArticles]=useState<Article[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(""),[refresh,setRefresh]=useState(0),[geo,setGeo]=useState<{lat:number;lon:number}|null>(null),[geoMessage,setGeoMessage]=useState("");
 useEffect(()=>{const ctrl=new AbortController();setBusy(true);setError("");fetch("/api/news?category="+encodeURIComponent(topic)+(topic==="Nearby"&&geo?"&lat="+geo.lat+"&lon="+geo.lon:""),{signal:ctrl.signal,cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("News temporarily unavailable");return r.json()}).then(d=>setArticles(d.articles||[])).catch(e=>{if(e.name!=="AbortError")setError(e.message)}).finally(()=>{if(!ctrl.signal.aborted)setBusy(false)});return()=>ctrl.abort()},[topic,refresh,geo]);
 useEffect(()=>{const timer=setInterval(()=>setRefresh(n=>n+1),300000);return()=>clearInterval(timer)},[]);\n const time=(s:string)=>{const d=new Date(s);return isNaN(d.getTime())?"Latest":d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})};
 const enableNearby=()=>{if(!navigator.geolocation){setGeoMessage("Location is not supported by this browser.");return;}setGeoMessage("Allow location access to load nearby headlines.");navigator.geolocation.getCurrentPosition((p)=>{setGeo({lat:p.coords.latitude,lon:p.coords.longitude});setTopic("Nearby");setGeoMessage("Showing headlines near your location.");},()=>setGeoMessage("Location permission was declined. You can still browse worldwide news."),{timeout:10000,maximumAge:300000});};
}
