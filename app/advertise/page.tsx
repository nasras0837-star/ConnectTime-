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
  const [dailyBudget, setDailyBudget] = useState("5");
  const [campaignBudget, setCampaignBudget] = useState("150");
  const [bidStrategy, setBidStrategy] = useState("lowest-cost");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [headline, setHeadline] = useState("");
  const [adCopy, setAdCopy] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  const submitForReview = async () => {
    setReviewMessage("");
    setReviewStatus("");
    if (!budgetValid || !startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setReviewStatus("invalid");
      setReviewMessage("Enter a daily budget of at least $1, a valid total campaign cap, and valid start/end dates.");
      return;
    }
    setReviewing(true);
    try {
      const response = await fetch("/api/advertising/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, campaign, headline, body: adCopy, imageUrl, rightsConfirmed }),
      });
      const result = await response.json();
      setReviewStatus(result.status || "error");
      if (result.status === "manual_review_required" && result.adSubmissionId) {
        const campaignResponse = await fetch("/api/advertising/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adSubmissionId: result.adSubmissionId, company, campaignName: campaign, objective: goal,
            placement: format, region: selectedRegion, country: selectedCountry, geoTargets: locations,
            dailyBudgetMinor: Math.round(Number(dailyBudget) * 100),
            lifetimeCapMinor: Math.round(Number(campaignBudget) * 100), bidStrategy,
            startAt: new Date(startDate + "T00:00:00.000Z").toISOString(),
            endAt: new Date(endDate + "T23:59:59.999Z").toISOString(),
          }),
        });
        const campaignResult = await campaignResponse.json();
        if (!campaignResponse.ok) {
          setReviewMessage("The ad passed preliminary AI screening and is awaiting human review, but the campaign draft could not be saved: " + (campaignResult.error || "Campaign storage is not configured."));
        } else {
          setReviewMessage("Preliminary AI screening did not flag the ad. Your campaign draft was saved for human review. It is not approved, charged, or eligible for delivery.");
        }
      } else {
        setReviewMessage(result.message || result.error || "Ad review could not be completed.");
      }
    } catch {
      setReviewStatus("unavailable");
      setReviewMessage("AI screening or campaign storage is unavailable. Payment and publication remain blocked.");
    } finally {
      setReviewing(false);
    }
  };
  const countries = useMemo(() => regions.find((region) => region.name === selectedRegion)?.countries ?? [], [selectedRegion]);
  const dailyBudgetValue = Number(dailyBudget);
  const campaignBudgetValue = Number(campaignBudget);
  const budgetValid = Number.isFinite(dailyBudgetValue) && Number.isFinite(campaignBudgetValue) && dailyBudgetValue >= 1 && campaignBudgetValue >= dailyBudgetValue;
  const objective = goal.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <main className="adMarketplace">
      <header className="adTopbar">
        <Link href="/" className="adBrand"><span className="adBrandMark">CT</span><span>ConnectTime <small>ADVERTISING</small></span></Link>
        <nav><Link href="/">Community</Link><Link href="/news">News</Link><Link href="/advertising-dashboard">My campaigns</Link><Link href="/signup" className="adTopCta">Create an account ↗</Link></nav>
      </header>
      <section className="adHero">
        <div className="adHeroCopy"><span className="adEyebrow">🌍 CONNECT WITH THE WORLD</span><h1>Put your brand<br /><em>on the map.</em></h1><p>Your paid ads are randomly shown to ConnectTime users located in the region and country you select. Reach a broad local audience without choosing individual people.</p><div className="adHeroTags"><span>Global reach</span><span>Random audience delivery</span><span>Advertiser-controlled budgets</span></div></div>
        <div className="adGlobeArt" aria-hidden="true"><div className="adGlobe">🌐</div><span className="adPin pinOne">📍 New York</span><span className="adPin pinTwo">📍 London</span><span className="adPin pinThree">📍 Tokyo</span><span className="adOrbit orbitOne" /><span className="adOrbit orbitTwo" /></div>
      </section>
      <section className="adStats"><div><b>🌎</b><strong>Worldwide</strong><span>Plan campaigns across markets</span></div><div><b>📌</b><strong>Regional reach</strong><span>Random users in your selected market</span></div><div><b>🎯</b><strong>Your budget</strong><span>Set daily and total spend limits</span></div><div><b>📊</b><strong>Performance</strong><span>Campaign reporting planned</span></div></section>
      <section className="adBuilder" id="campaign-builder">
        <div className="adBuilderIntro"><span className="adEyebrow">CAMPAIGN PLANNER</span><h2>Build your advertising campaign</h2><p>Choose your objective, audience, schedule, and maximum spend. Eligible ads compete in a real-time auction when delivery is enabled.</p></div>
        <div className="adBuilderGrid"><div className="adForm">
          <section className="adFormSection"><div className="adStep"><span>01</span><div><h3>Business details</h3><p>Who is advertising on ConnectTime?</p></div></div>
            <label>Company or agency name<input value={company} onChange={(e) => { setCompany(e.target.value); }} placeholder="Your company name" /></label>
            <label>Company website <span className="adOptional">Optional</span><input value={website} onChange={(e) => { setWebsite(e.target.value); setSaved(false); }} placeholder="https://yourcompany.com" /></label>
            <label>Campaign name<input value={campaign} onChange={(e) => { setCampaign(e.target.value); setSaved(false); }} placeholder="Spring launch campaign" /></label>
            <label>Campaign objective<select value={goal} onChange={(e) => setGoal(e.target.value)}><option value="brand-awareness">Brand awareness</option><option value="website-visits">Website visits</option><option value="sales-leads">Sales and leads</option><option value="event-attendance">Event attendance</option><option value="app-installs">App promotion</option></select></label>
          </section>
          <section className="adFormSection"><div className="adStep"><span>02</span><div><h3>Choose your ad placement</h3><p>Select the format that fits your campaign.</p></div></div>
            <div className="adFormatGrid">{formats.map((item) => <button type="button" key={item.id} className={format === item.id ? "adFormat selected" : "adFormat"} onClick={() => { setFormat(item.id); setSaved(false); }}><span>{item.icon}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div>
          </section>
          <section className="adFormSection"><div className="adStep"><span>03</span><div><h3>Choose your ad audience region</h3><p>Your ad is randomly delivered to users in the selected region and country.</p></div></div>
            <label>World region<select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCountry(regions.find((r) => r.name === e.target.value)?.countries[0] ?? ""); setSaved(false); }}>{regions.map((region) => <option key={region.name}>{region.name}</option>)}</select></label>
            <label>Country<select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSaved(false); }}>{countries.map((country) => <option key={country}>{country}</option>)}</select></label>
            <label>Specific cities, states, postal codes or neighborhoods <span className="adOptional">Optional</span><textarea value={locations} onChange={(e) => { setLocations(e.target.value); setSaved(false); }} placeholder={"Example: New York, NY; Newark, NJ; 10001\nEnter multiple locations separated by commas."} rows={3} /></label>
            <div className="adLocationHint">🎯 Ads are randomly shown to eligible ConnectTime users in your selected region and country. Optional city/radius settings can narrow the eligible audience where supported</div>
            <label>Target radius<select value={radius} onChange={(e) => setRadius(e.target.value)}><option value="5">5 miles / 8 km</option><option value="10">10 miles / 16 km</option><option value="25">25 miles / 40 km</option><option value="50">50 miles / 80 km</option><option value="100">100 miles / 160 km</option><option value="all">Entire selected country</option></select></label>
          </section>
          <section className="adFormSection"><div className="adStep"><span>04</span><div><h3>Set your budget and dates</h3><p>Choose what you can afford. Your campaign cannot exceed your total budget cap.</p></div></div>
            <div className="adBudgetControls"><label>Daily budget (USD)<input type="number" min="1" step="0.01" value={dailyBudget} onChange={(e) => { setDailyBudget(e.target.value); setSaved(false); }} /></label><label>Total campaign budget cap (USD)<input type="number" min="1" step="0.01" value={campaignBudget} onChange={(e) => { setCampaignBudget(e.target.value); setSaved(false); }} /></label><label>Delivery bidding strategy<select value={bidStrategy} onChange={(e) => setBidStrategy(e.target.value)}><option value="lowest-cost">Automatic — get the most results within my budget</option><option value="cost-cap">Cost goal — aim for an average result cost</option><option value="bid-cap">Bid cap — set a maximum auction bid</option></select></label><p className="adBudgetNote">Minimum starting daily budget: $1 USD. Your total campaign cap must be at least your daily budget. Auction prices vary with competition, objective, geography, placement, and ad quality. Results are not guaranteed.</p></div>
            <div className="adDateGrid"><label>Start date<input type="date" required value={startDate} onChange={(e) => { setStartDate(e.target.value); setSaved(false); }} /></label><label>End date<input type="date" required min={startDate || undefined} value={endDate} onChange={(e) => { setEndDate(e.target.value); setSaved(false); }} /></label></div>
            <p className="adBudgetNote">ConnectTime will charge only for eligible, measured campaign delivery under the selected billing model. Billing and auction delivery are not active in this preview.</p>
          </section>
          <section className="adFormSection"><div className="adStep"><span>05</span><div><h3>Ad creative and safety screening</h3><p>Submit the actual ad content for AI safety screening before it can be considered for approval.</p></div></div>
            <label>Ad headline<input value={headline} maxLength={200} onChange={(e) => { setHeadline(e.target.value); setReviewStatus(""); }} placeholder="Write your ad headline" /></label>
            <label>Ad text<textarea value={adCopy} maxLength={2000} onChange={(e) => { setAdCopy(e.target.value); setReviewStatus(""); }} rows={4} placeholder="Describe the product, service, offer, and claims in your advertisement." /></label>
            <label>Creative image URL <span className="adOptional">Optional · HTTPS</span><input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setReviewStatus(""); }} placeholder="https://example.com/your-ad-image.jpg" /></label>
            <label className="adRightsCheck"><input type="checkbox" checked={rightsConfirmed} onChange={(e) => { setRightsConfirmed(e.target.checked); setReviewStatus(""); }} /> I own or have documented permission to use all submitted text, images, videos, logos, trademarks, music, and other creative assets. I will not submit infringing or misleading material.</label>
            <div className="adSecureNote">🚫 No nudity, pornography, sexual services, exploitative content, hate, harassment, graphic violence, illegal products, scams, or deceptive ads. Suspected copyright/trademark violations require human review. AI screening does not prove ownership.</div>
            <p className="adBudgetNote" role="status">{reviewMessage || "AI screening must complete before review. A clean AI result is not final campaign approval."}</p>
          </section>
          <div className="adSubmitArea"><button type="button" className="adSaveButton" onClick={submitForReview} disabled={reviewing || !budgetValid || !company.trim() || !campaign.trim() || (!headline.trim() && !adCopy.trim() && !imageUrl.trim()) || !rightsConfirmed}>{reviewing ? "Screening ad…" : "Submit ad for AI screening ↗"}</button><p>{reviewStatus === "rejected" ? "Rejected: payment and publication are blocked." : reviewStatus === "manual_review_required" ? "AI screen passed. Human copyright, trademark, identity, and policy review is still required. Payment and publication remain blocked." : "No payment is collected and no ad is published through this preview."} <Link href="/advertising-dashboard">View campaign drafts ↗</Link></p></div>
        </div>
        <aside className="adSummary"><div className="adSummaryHead"><span>LIVE CAMPAIGN SUMMARY</span><b>✦</b></div>
          <div className="adPreviewCard"><div className="adPreviewLabel">SPONSORED PREVIEW</div><div className="adPreviewVisual"><span>YOUR BRAND</span><b>Make your next move memorable.</b><small>Your campaign creative will appear here.</small></div><div className="adPreviewMeta"><b>{campaign || "Your campaign name"}</b><span>Sponsored · ConnectTime</span></div></div>
          <div className="adSummaryBlock"><small>ADVERTISER</small><strong>{company || "Your company"}</strong>{website && <span>{website}</span>}</div>
          <div className="adSummaryBlock"><small>PLACEMENT</small><strong>{formats.find((item) => item.id === format)?.title}</strong></div>
          <div className="adSummaryBlock"><small>RANDOM AD DELIVERY</small><strong>{selectedCountry}</strong><span>{selectedRegion} · {radius === "all" ? "Country-wide" : radius + " mile radius"}</span><span>Random eligible users in this audience</span>{locations && <span className="adLocationText">{locations}</span>}</div>
          <div className="adSummaryBlock"><small>CAMPAIGN OBJECTIVE</small><strong>{objective}</strong></div>
          <div className="adBudgetSummary"><small>YOUR SPENDING LIMITS</small><strong>${(Number.isFinite(dailyBudgetValue) ? dailyBudgetValue : 0).toFixed(2)} <i>maximum per day</i></strong><span>${(Number.isFinite(campaignBudgetValue) ? campaignBudgetValue : 0).toFixed(2)} total campaign cap</span><span>{bidStrategy === "lowest-cost" ? "Automatic lowest-cost bidding" : bidStrategy === "cost-cap" ? "Cost goal bidding" : "Maximum bid cap"}</span><p>{budgetValid ? "Your total spend will be limited to the campaign cap; unused budget is not charged." : "Enter a daily budget of at least $1 and a total campaign cap equal to or greater than your daily budget."}</p></div>
          <div className="adSecureNote">🔒 No payment is collected in this preview. Auction delivery, verified billing, spend pacing, and campaign reporting are not live yet. Ads remain unpublished until safety checks, human review, and secure billing are implemented.</div>
        </aside></div>
      </section>
      <section className="adHow"><div><span className="adEyebrow">SIMPLE BY DESIGN</span><h2>From local business to global brand.</h2></div><div className="adHowGrid"><article><b>1</b><h3>Select your region</h3><p>Choose the region and country. ConnectTime randomly displays your paid ad to eligible users there.</p></article><article><b>2</b><h3>Set your campaign</h3><p>Choose a daily budget, total spend cap, objective, placement, and schedule.</p></article><article><b>3</b><h3>Review and launch</h3><p>After approval and checkout, eligible campaigns compete in real time. You pay for measured delivery, up to your spending limits.</p></article></div></section>
      <footer className="adFooter"><span>© {new Date().getFullYear()} ConnectTime Advertising</span><span>Advertiser policies · Privacy · Help</span><Link href="/">Back to ConnectTime ↗</Link></footer>
    </main>
  );
}
