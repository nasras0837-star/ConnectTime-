"use client";

import { useEffect, useState } from "react";
import { languages } from "@/lib/i18n";
import { regionCountries, useLanguage } from "./language-provider";

type DisplayMode = "expanded" | "minimized" | "hidden";
const DISPLAY_KEY = "connect-region-widget-display";

export function LanguageSwitcher() {
  const { language, setLanguage, t, countryCode, setCountryCode, countryName, regionReady } = useLanguage();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("expanded");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DISPLAY_KEY);
      if (saved === "minimized" || saved === "hidden") setDisplayMode(saved);
    } catch { /* Keep the selector available if storage is blocked. */ }
    setRestored(true);
  }, []);

  function changeDisplayMode(mode: DisplayMode) {
    setDisplayMode(mode);
    try { window.localStorage.setItem(DISPLAY_KEY, mode); } catch { /* The choice lasts for this visit. */ }
  }

  const selectedLanguage = languages.find(item => item.code === language);
  const regionLabel = countryCode === "AUTO" ? "Automatic region" : countryName;
  const languageLabel = selectedLanguage?.native ?? language;

  if (!restored) return <div className="ctLanguageControl" aria-hidden="true" />;

  if (displayMode === "hidden") {
    return (
      <div className="ctLanguageControl ctLanguageControlHidden">
        <button type="button" className="ctLanguageReopen" onClick={() => changeDisplayMode("expanded")} aria-label="Show region and language settings">
          <span aria-hidden="true">🌍</span><span>Region settings</span><span className="ctLanguageCurrent">{regionLabel} · {languageLabel}</span><span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <section className={"ctLanguageControl" + (displayMode === "minimized" ? " isMinimized" : "")} aria-label="Region and language settings">
      <div className="ctLanguageWidgetHead">
        <div className="ctLanguageWidgetTitle"><span aria-hidden="true">🌍</span><div><strong>Region &amp; language</strong><small>{regionLabel} · {languageLabel}</small></div></div>
        <div className="ctLanguageWidgetActions">
          <button type="button" onClick={() => changeDisplayMode(displayMode === "minimized" ? "expanded" : "minimized")} aria-label={displayMode === "minimized" ? "Expand region settings" : "Minimize region settings"} aria-expanded={displayMode === "expanded"}>{displayMode === "minimized" ? "＋" : "−"}</button>
          <button type="button" onClick={() => changeDisplayMode("hidden")} aria-label="Hide region settings">×</button>
        </div>
      </div>
      {displayMode === "expanded" && (
        <div className="ctLanguageWidgetBody">
          <label htmlFor="ct-region-country">Country or region</label>
          <select id="ct-region-country" value={countryCode} onChange={event => setCountryCode(event.target.value)} aria-label="Choose your country or region">
            <option value="AUTO">Auto-detect my region</option>
            {regionCountries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <label htmlFor="ct-language-select">Preferred language</label>
          <select id="ct-language-select" value={language} onChange={event => setLanguage(event.target.value as (typeof languages)[number]["code"])} aria-label={t("language")}>
            {languages.map(item => <option key={item.code} value={item.code}>{item.native}</option>)}
          </select>
          <div className="ctLanguageWidgetFooter"><span>{regionReady ? "Your choices are saved on this device." : "Detecting your region…"}</span><button type="button" onClick={() => changeDisplayMode("hidden")}>Hide from homepage</button></div>
        </div>
      )}
      {displayMode === "minimized" && <button type="button" className="ctLanguageExpand" onClick={() => changeDisplayMode("expanded")}>Change region or language</button>}
    </section>
  );
}
