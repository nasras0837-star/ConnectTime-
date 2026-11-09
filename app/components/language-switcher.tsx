"use client";

import { languages } from "@/lib/i18n";
import { regionCountries, useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage, t, countryCode, setCountryCode, countryName } = useLanguage();
  return (
    <div className="ctLanguageControl">
      <label htmlFor="ct-region-country">🌍 <span>Region</span></label>
      <select id="ct-region-country" value={countryCode} onChange={event => setCountryCode(event.target.value)} aria-label="Choose your country or region">
        <option value="AUTO">Auto-detect my region</option>
        {regionCountries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
      <label htmlFor="ct-language-select">🌐 <span>{t("language")}</span></label>
      <select id="ct-language-select" value={language} onChange={event => setLanguage(event.target.value as (typeof languages)[number]["code"])} aria-label={t("language")}>
        {languages.map(item => <option key={item.code} value={item.code}>{item.native}</option>)}
      </select>
      <span className="ctLanguageSaved">Regional edition: {countryName}. Your choices are saved on this device.</span>
    </div>
  );
}
