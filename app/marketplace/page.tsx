"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";

const categories = ["All categories","Real estate","Vehicles","Electronics","Furniture","Clothing & accessories","Comic books","Sports cards","Collectibles","Home & garden","Tools & equipment","Books & media","Toys & games","Other products"];
const sellCategories = categories.slice(1);
type Listing = { id:string; category:string; title:string; description:string; price:number; condition:string; location:string; createdAt:string; seller:{handle:string;displayName:string}; mine:boolean };
const money = (value:number) => new Intl.NumberFormat(undefined,{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value);
const dateLabel = (value:string) => { const d=new Date(value); return Number.isNaN(d.getTime())?"Recently listed":d.toLocaleDateString(); };

export default function MarketplacePage(){
 const [items,setItems]=useState<Listing[]>([]),[category,setCategory]=useState("All categories"),[search,setSearch]=useState("");
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState(""),[saving,setSaving]=useState(false);
 async function refresh(){setLoading(true);setError("");try{const r=await fetch("/api/marketplace/items",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Marketplace is unavailable.");setItems(Array.isArray(d.items)?d.items:[])}catch(e){setError(e instanceof Error?e.message:"Marketplace is unavailable.")}finally{setLoading(false)}}
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch populates the marketplace.
 useEffect(()=>{void refresh()},[]);
 const visible=useMemo(()=>items.filter(x=>(category==="All categories"||x.category===category)&&(!search.trim()||[x.title,x.description,x.location,x.category].join(" ").toLowerCase().includes(search.trim().toLowerCase()))),[items,category,search]);
 async function create(event:FormEvent<HTMLFormElement>){event.preventDefault();const formElement=event.currentTarget;setSaving(true);setError("");setNotice("");const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());try{const r=await fetch("/api/marketplace/items",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Your listing could not be created.");setItems(current=>[d.item,...current]);formElement.reset();setNotice("Your item is now listed on Connect Marketplace.");}catch(e){setError(e instanceof Error?e.message:"Your listing could not be created.")}finally{setSaving(false)}}
 async function report(item:Listing){const details=window.prompt("Tell our safety team why this listing should be reviewed (at least 10 characters).");if(!details||details.trim().length<10)return;try{const r=await fetch("/api/community/reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category:"other",targetType:"other",contentReference:item.id,details:details.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Report could not be submitted.");setNotice("Thank you. This listing was reported for review.")}catch(e){setError(e instanceof Error?e.message:"Report could not be submitted.")}}
 return <main className="marketPage">
  <ConnectSiteHeader />
  <section className="marketHero"><span>MARKETPLACE</span><h1>Buy and sell with members</h1><p>Search listings, filter by category, or post an item for sale.</p></section>
  {notice&&<p className="marketNotice" role="status">{notice}</p>}{error&&<p className="marketError" role="alert">{error}</p>}
  <section className="marketLayout">
   <div className="marketBrowse"><div className="marketSectionHead"><div><span>FIND SOMETHING GREAT</span><h2>Explore listings</h2></div><button type="button" onClick={()=>void refresh()}>Refresh</button></div>
    <input className="marketSearch" aria-label="Search listings" placeholder="Search products, categories or locations…" value={search} onChange={e=>setSearch(e.target.value)}/>
    <label className="marketCategorySelect">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    {loading?<p className="marketEmpty">Loading listings…</p>:visible.length?<div className="marketGrid">{visible.map(item=><article className="marketCard" key={item.id}><div className="marketCardTop"><span>{item.category}</span><small>{dateLabel(item.createdAt)}</small></div><h3>{item.title}</h3><strong className="marketPrice">{money(item.price)}</strong><p>{item.description}</p><div className="marketMeta"><span>{item.condition}</span><span>📍 {item.location}</span></div><div className="marketSeller"><span>Listed by <b>{item.seller.displayName||item.seller.handle}</b></span>{item.mine?<small>Your listing</small>:<Link href={item.seller.handle?"/messages?with="+encodeURIComponent(item.seller.handle):"/messages"}>Contact seller ↗</Link>}</div>{!item.mine&&<button className="marketReport" type="button" onClick={()=>void report(item)}>Report listing</button>}</article>)}</div>:<div className="marketEmpty">No listings match this search yet. Be the first to list something.</div>}
   </div>
   <details className="marketSell marketSellDetails"><summary>＋ Post an item for sale</summary><div className="marketSellBody"><p>Add a few details so buyers know what you are offering.</p><form onSubmit={create}>
     <label>Category<select name="category" required defaultValue=""><option value="" disabled>Choose a category</option>{sellCategories.map(c=><option key={c}>{c}</option>)}</select></label>
     <label>Item or property title<input name="title" required minLength={3} maxLength={100} placeholder="e.g. 2022 Honda Civic EX"/></label>
     <label>Description<textarea name="description" required minLength={15} maxLength={1800} rows={5} placeholder="Describe the item, features, condition and anything buyers should know."/></label>
     <label>Price (USD)<input name="price" required type="number" min="0.01" max="100000000" step="0.01" placeholder="e.g. 125.00"/></label>
     <label>Condition<select name="condition" required defaultValue=""><option value="" disabled>Choose condition</option><option>New</option><option>Like new</option><option>Good</option><option>Fair</option><option>For parts / renovation</option><option>Not applicable (real estate)</option></select></label>
     <label>City / area<input name="location" required minLength={2} maxLength={100} placeholder="e.g. Vineland, NJ"/></label>
     <button type="submit" disabled={saving}>{saving?"Posting…":"Post listing"}</button>
    </form>
    <p className="marketPolicy">By posting, you agree to the <Link href="/legal/terms">Connect Terms</Link>. Listings must be for lawful goods or property. Prostitution, escort services, sexual services, and any solicitation or advertising of paid sexual activity are strictly prohibited. Listings may be removed and accounts may be restricted or banned for violations.</p></div></details>
  </section>
  <footer className="marketFooter"><Link href="/safety">Safety Center</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · Connect Marketplace</footer>
 </main>
}
