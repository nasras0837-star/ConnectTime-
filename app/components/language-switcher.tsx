"use client";

import { languages } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="ctLanguageControl">
      <label htmlFor="ct-language-select">🌐 <span>{t("language")}</span></label>
      <select id="ct-language-select" value={language} onChange={(event) => setLanguage(event.target.value as (typeof languages)[number]["code"])} aria-label={t("language")}>
        {languages.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
      </select>
      <span className="ctLanguageSaved">{t("languageSaved")}</span>
    </div>
  );
}
