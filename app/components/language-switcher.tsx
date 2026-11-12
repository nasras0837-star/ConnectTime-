"use client";
import { useEffect, useState } from "react";
import { languages } from "@/lib/i18n";
import { regionCountries, useLanguage } from "./language-provider";
type WidgetMode = "expanded" | "minimized" | "hidden" | "closed";
const STORAGE_KEY = "connect-region-widget-mode";
export function LanguageSwitcher() {
  const { language, setLanguage, t, countryCode, setCountryCode, countryName } = useLanguage();
  const [mode, setMode] = useState<WidgetMode>("expanded");
  useEffect(() => {
    try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved === "minimized" || saved === "hidden" || saved === "closed") setMode(saved); }
    catch { /* Keep expanded when storage is unavailable. */ }
  }, []);
  const changeMode = (next: WidgetMode) => {
    setMode(next);
    try { if (next === "expanded") window.localStorage.removeItem(STORAGE_KEY); else window.localStorage.setItem(STORAGE_KEY, next); }
    catch { /* The control remains usable for this visit. */ }
  };
  if (mode === "closed") return <button className="ctLanguageReopen ctLanguageReopenClosed" type="button" onClick={() => changeMode("expanded")} aria-label="Reopen region and language settings" title="Region and language settings">🌐</button>;
  if (mode === "hidden") return <button className="ctLanguageReopen" type="button" onClick={() => changeMode("expanded")}>Show region &amp; language <span aria-hidden="true">↑</span></button>;
  if (mode === "minimized") return (
    <div className="ctLanguageControl ctLanguageMinimized" aria-label="Region and language settings minimized">
      <button type="button" className="ctLanguageExpand" onClick={() => changeMode("expanded")} aria-label="Expand region and language settings">🌍 {countryCode} <span>·</span> 🌐 {language.toUpperCase()} <span aria-hidden="true">⌃</span></button>
      <button type="button" className="ctLanguageWidgetAction" onClick={() => changeMode("hidden")} aria-label="Hide region and language settings" title="Hide">−</button>
      <button type="button" className="ctLanguageWidgetAction" onClick={() => changeMode("closed")} aria-label="Close region and language settings" title="Close">×</button>
    </div>
  );
  return (
    <div className="ctLanguageControl" aria-label="Region and language settings">
      <label htmlFor="ct-region-country">🌍 <span>Region</span></label>
      <select id="ct-region-country" value={countryCode} onChange={event => setCountryCode(event.target.value)} aria-label="Choose your country or region">
        <option value="AUTO">Auto-detect my region</option>{regionCountries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
      <label htmlFor="ct-language-select">🌐 <span>{t("language")}</span></label>
      <select id="ct-language-select" value={language} onChange={event => setLanguage(event.target.value as (typeof languages)[number]["code"])} aria-label={t("language")}>
        {languages.map(item => <option key={item.code} value={item.code}>{item.native}</option>)}
      </select>
      <span className="ctLanguageSaved">Regional edition: {countryName}. Your choices are saved on this device.</span>
      <div className="ctLanguageWidgetActions">
        <button type="button" onClick={() => changeMode("minimized")} aria-label="Minimize region and language settings" title="Minimize">−</button>
        <button type="button" onClick={() => changeMode("hidden")} aria-label="Hide region and language settings" title="Hide">⌄</button>
        <button type="button" onClick={() => changeMode("closed")} aria-label="Close region and language settings" title="Close">×</button>
      </div>
    </div>
  );
}
