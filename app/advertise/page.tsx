"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const regions = [
  { name: "North America", countries: ["United States", "Canada", "Mexico"] },
  { name: "Central America & Caribbean", countries: ["Costa Rica", "Panama", "Guatemala", "Jamaica", "Dominican Republic", "Trinidad and Tobago"] },
  { name: "South America", countries: ["Brazil", "Argentina", "Colombia", "Chile", "Peru", "Ecuador", "Uruguay", "Venezuela", "Bolivia", "Paraguay"] },
  { name: "Europe", countries: ["United Kingdom", "Ireland", "France", "Germany", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria", "Portugal", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czechia", "Greece", "Romania", "Ukraine", "Turkey"] },
  { name: "Middle East", countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Jordan", "Israel", "Lebanon", "Oman", "Kuwait", "Bahrain", "Iraq"] },
  { name: "Africa", countries: ["South Africa", "Nigeria", "Kenya", "Ghana", "Egypt", "Morocco", "Algeria", "Tunisia", "Ethiopia", "Tanzania", "Uganda", "Senegal", "Ivory Coast", "Cameroon", "Zimbabwe", "Zambia"] },
  { name: "Asia", countries: ["India", "China", "Japan", "South Korea", "Indonesia", "Pakistan", "Bangladesh", "Vietnam", "Thailand", "Malaysia", "Singapore", "Philippines", "Taiwan", "Sri Lanka", "Nepal", "Cambodia"] },
  { name: "Oceania", countries: ["Australia", "New Zealand", "Fiji", "Papua New Guinea"] },
];
const formats = [
  { id: "feed", title: "Sponsored feed post", description: "Native-style promotion in community feeds", icon: "▤" },
  { id: "banner", title: "Display banner", description: "Brand awareness across selected pages", icon: "▰" },
  { id: "video", title: "Video promotion", description: "Promote a video or creator campaign", icon: "▶" },
  { id: "event", title: "Event promotion", description: "Reach people near an event location", icon: "📍" },
];

export default function AdvertisePage() {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [campaign, setCampaign] = useState("");
  const [goal, setGoal] = useState("brand-awareness");
  const [format, setFormat] = useState("feed");
  const [selectedRegion, setSelectedRegion] = useState("North America");
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [locations, setLocations] = useState("");
  const [radius, setRadius] = useState("25");
  const monthlyAdFee = 49.99;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saved, setSaved] = useState(false);
  const countries = useMemo(() => regions.find((region) => region.name === selectedRegion)?.countries ?? [], [selectedRegion]);
  const totalBudget = monthlyAdFee;
  const dailyBudget = startDate && endDate && new Date(endDate) >= new Date(startDate)
    ? totalBudget * (Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) / 30 : null;
  const objective = goal.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <main className="adMarketplace">
      <header className="adTopbar">
        <Link href="/" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link>
        <nav><Link href="/">Community</Link><Link href="/news">News</Link><Link href="/signup" className="adTopCta">Create an account ↗</Link></nav>
      </header>
      <section className="adHero">
        <div className="adHeroCopy"><span className="adEyebrow">🌍 CONNECT WITH THE WORLD</span><h1>Put your brand<br /><em>on the map.</em></h1><p>Reach communities across countries, regions, cities, and local neighborhoods. Build campaigns around the places that matter to your business.</p><div className="adHeroTags"><span>Global reach</span><span>Local targeting</span><span>Campaign control</span></div></div>
        <div className="adGlobeArt" aria-hidden="true"><div className="adGlobe">🌐</div><span className="adPin pinOne">📍 New York</span><span className="adPin pinTwo">📍 London</span><span className="adPin pinThree">📍 Tokyo</span><span className="adOrbit orbitOne" /><span className="adOrbit orbitTwo" /></div>
      </section>
      <section className="adStats"><div><b>🌎</b><strong>Worldwide</strong><span>Plan campaigns across markets</span></div><div><b>📌</b><strong>Location-led</strong><span>Focus on cities and local areas</span></div><div><b>🎯</b><strong>Your budget</strong><span>Flat monthly fee</span></div><div><b>📊</b><strong>Performance</strong><span>Campaign reporting planned</span></div></section>
      <section className="adBuilder" id="campaign-builder">
        <div className="adBuilderIntro"><span className="adEyebrow">CAMPAIGN PLANNER</span><h2>Build your advertising campaign</h2><p>Tell us what you want to promote and where you want people to see it.</p></div>
        <div className="adBuilderGrid"><div className="adForm">
          <section className="adFormSection"><div className="adStep"><span>01</span><div><h3>Business details</h3><p>Who is advertising on ConnectTime?</p></div></div>
            <label>Company or agency name<input value={company} onChange={(e) => { setCompany(e.target.value); setSaved(false); }} placeholder="Your company name" /></label>
            <label>Company website <span className="adOptional">Optional</span><input value={website} onChange={(e) => { setWebsite(e.target.value); setSaved(false); }} placeholder="https://yourcompany.com" /></label>
            <label>Campaign name<input value={campaign} onChange={(e) => { setCampaign(e.target.value); setSaved(false); }} placeholder="Spring launch campaign" /></label>
            <label>Campaign objective<select value={goal} onChange={(e) => setGoal(e.target.value)}><option value="brand-awareness">Brand awareness</option><option value="website-visits">Website visits</option><option value="sales-leads">Sales and leads</option><option value="event-attendance">Event attendance</option><option value="app-installs">App promotion</option></select></label>
          </section>
          <section className="adFormSection"><div className="adStep"><span>02</span><div><h3>Choose your ad placement</h3><p>Select the format that fits your campaign.</p></div></div>
            <div className="adFormatGrid">{formats.map((item) => <button type="button" key={item.id} className={format === item.id ? "adFormat selected" : "adFormat"} onClick={() => { setFormat(item.id); setSaved(false); }}><span>{item.icon}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div>
          </section>
          <section className="adFormSection"><div className="adStep"><span>03</span><div><h3>Target your locations</h3><p>Choose a broad market or narrow down to local areas.</p></div></div>
            <label>World region<select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCountry(regions.find((r) => r.name === e.target.value)?.countries[0] ?? ""); setSaved(false); }}>{regions.map((region) => <option key={region.name}>{region.name}</option>)}</select></label>
            <label>Country<select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSaved(false); }}>{countries.map((country) => <option key={country}>{country}</option>)}</select></label>
            <label>Specific cities, states, postal codes or neighborhoods <span className="adOptional">Optional</span><textarea value={locations} onChange={(e) => { setLocations(e.target.value); setSaved(false); }} placeholder={"Example: New York, NY; Newark, NJ; 10001\nEnter multiple locations separated by commas."} rows={3} /></label>
            <div className="adLocationHint">📍 For location-based campaigns, you can define a radius around each selected place. Final targeting availability depends on the location data supported at launch.</div>
            <label>Target radius<select value={radius} onChange={(e) => setRadius(e.target.value)}><option value="5">5 miles / 8 km</option><option value="10">10 miles / 16 km</option><option value="25">25 miles / 40 km</option><option value="50">50 miles / 80 km</option><option value="100">100 miles / 160 km</option><option value="all">Entire selected country</option></select></label>
          </section>
          <section className="adFormSection"><div className="adStep"><span>04</span><div><h3>Set your budget and dates</h3><p>One ad costs $49.99 per month in any selected region or country.</p></div></div>
            <div className="adFixedPrice"><span>MONTHLY PRICE · PER AD</span><strong>$49.99 <small>USD / month</small></strong><p>Same flat rate worldwide. Select the region and country where your audience should see this ad.</p></div>
            <div className="adDateGrid"><label>Start date<input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setSaved(false); }} /></label><label>End date<input type="date" min={startDate || undefined} value={endDate} onChange={(e) => { setEndDate(e.target.value); setSaved(false); }} /></label></div>
            <p className="adBudgetNote">Flat monthly rate: $49.99 per ad. Billing begins only after campaign approval and checkout confirmation.</p>
          </section>
          <div className="adSubmitArea"><button type="button" className="adSaveButton" onClick={() => setSaved(true)} disabled={!company.trim() || !campaign.trim()}>Save campaign plan ↗</button><p>{saved ? "Campaign plan prepared in this preview. It has not been submitted or charged." : "Planning preview only — saving does not create a live campaign or charge a payment method."}</p></div>
        </div>
        <aside className="adSummary"><div className="adSummaryHead"><span>LIVE CAMPAIGN SUMMARY</span><b>✦</b></div>
          <div className="adPreviewCard"><div className="adPreviewLabel">SPONSORED PREVIEW</div><div className="adPreviewVisual"><span>YOUR BRAND</span><b>Make your next move memorable.</b><small>Your campaign creative will appear here.</small></div><div className="adPreviewMeta"><b>{campaign || "Your campaign name"}</b><span>Sponsored · ConnectTime</span></div></div>
          <div className="adSummaryBlock"><small>ADVERTISER</small><strong>{company || "Your company"}</strong>{website && <span>{website}</span>}</div>
          <div className="adSummaryBlock"><small>PLACEMENT</small><strong>{formats.find((item) => item.id === format)?.title}</strong></div>
          <div className="adSummaryBlock"><small>LOCATION TARGETING</small><strong>{selectedCountry}</strong><span>{selectedRegion} · {radius === "all" ? "Country-wide" : radius + " mile radius"}</span>{locations && <span className="adLocationText">{locations}</span>}</div>
          <div className="adSummaryBlock"><small>CAMPAIGN OBJECTIVE</small><strong>{objective}</strong></div>
          <div className="adBudgetSummary"><small>MONTHLY AD FEE</small><strong>${totalBudget.toFixed(2)} <i>USD / month</i></strong>{dailyBudget !== null && Number.isFinite(dailyBudget) && <span>Estimated ${dailyBudget.toFixed(2)} for this date range</span>}<p>Flat rate per ad, worldwide. No payment is collected in this planning preview.</p></div>
          <div className="adSecureNote">🔒 Payment is not collected in this preview. Advertiser verification, campaign review, billing, and reporting will be connected before paid campaigns go live.</div>
        </aside></div>
      </section>
      <section className="adHow"><div><span className="adEyebrow">SIMPLE BY DESIGN</span><h2>From local business to global brand.</h2></div><div className="adHowGrid"><article><b>1</b><h3>Choose your audience</h3><p>Select countries, regions, cities, postal codes, and service areas.</p></article><article><b>2</b><h3>Set your campaign</h3><p>Pick a placement, objective, schedule, and monthly ad fee.</p></article><article><b>3</b><h3>Review and launch</h3><p>Submit your ad for policy review, confirm the price, and pay securely when checkout is enabled.</p></article></div></section>
      <footer className="adFooter"><span>© {new Date().getFullYear()} ConnectTime Advertising</span><span>Advertiser policies · Privacy · Help</span><Link href="/">Back to ConnectTime ↗</Link></footer>
    </main>
  );
}
