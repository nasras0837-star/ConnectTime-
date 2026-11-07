"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LanguageCode, languages, messages } from "@/lib/i18n";

type LanguageContextValue = { language: LanguageCode; setLanguage: (value: LanguageCode) => void; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("connecttime-language");
      if (saved && languages.some((item) => item.code === saved)) window.setTimeout(() => setLanguageState(saved as LanguageCode), 0);
    } catch { /* Storage may be unavailable; English remains the fallback. */ }
  }, []);
  useEffect(() => {
    const selected = languages.find((item) => item.code === language) ?? languages[0];
    document.documentElement.lang = language;
    document.documentElement.dir = selected.dir;
    try { window.localStorage.setItem("connecttime-language", language); } catch { /* Preference remains active for this session. */ }
  }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key: string) => messages[language][key] ?? messages.en[key] ?? key,
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageText({ k, fallback }: { k: string; fallback?: string }) {
  const { t } = useLanguage();
  return <>{t(k) === k ? fallback ?? k : t(k)}</>;
}
