"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LanguageCode, languages, messages } from "@/lib/i18n";

export const regionCountries = [
  ["US","United States"],["GB","United Kingdom"],["CA","Canada"],["AU","Australia"],["NZ","New Zealand"],["IE","Ireland"],
  ["DE","Germany"],["FR","France"],["ES","Spain"],["IT","Italy"],["NL","Netherlands"],["PT","Portugal"],["SE","Sweden"],
  ["BR","Brazil"],["MX","Mexico"],["AR","Argentina"],["CL","Chile"],["CO","Colombia"],
  ["IN","India"],["JP","Japan"],["CN","China"],["TW","Taiwan"],["KR","South Korea"],["SG","Singapore"],["MY","Malaysia"],["ID","Indonesia"],["TH","Thailand"],
  ["ZA","South Africa"],["NG","Nigeria"],["KE","Kenya"],["UG","Uganda"],
  ["AE","United Arab Emirates"],["SA","Saudi Arabia"],["QA","Qatar"],["PK","Pakistan"]
] as const;
export type RegionCountryCode = typeof regionCountries[number][0];
type LanguageContextValue = {
  language: LanguageCode; setLanguage: (value: LanguageCode) => void; t: (key: string) => string;
  countryCode: string; setCountryCode: (value: string) => void; countryName: string;
  temperatureUnit: "fahrenheit" | "celsius"; timeZone: string; regionReady: boolean;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

const countryLanguage: Record<string, LanguageCode> = {
  ES:"es",MX:"es",AR:"es",CL:"es",CO:"es",FR:"fr",CA:"en",DE:"en",BR:"pt",PT:"pt",IN:"hi",PK:"ur",CN:"zh",TW:"zh",SA:"ar",AE:"ar",QA:"ar"
};
const fahrenheitCountries = new Set(["US","BS","BZ","KY","PW","FM","MH","LR"]);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [countryCode, setCountryCodeState] = useState("US");
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [timeZone, setTimeZone] = useState("UTC");
  const [regionReady, setRegionReady] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const savedLanguage = window.localStorage.getItem("connect-language");
      const savedCountry = window.localStorage.getItem("connect-country-manual");
      if (savedLanguage && languages.some(item => item.code === savedLanguage)) setLanguageState(savedLanguage as LanguageCode);
      if (savedCountry && /^[A-Z]{2}$/.test(savedCountry)) setCountryCodeState(savedCountry);
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch { /* Browser privacy settings may disable local preferences. */ }
    fetch("/api/region", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        if (!active) return;
        const savedCountry = window.localStorage.getItem("connect-country-manual");
        const selectedCountry = savedCountry && /^[A-Z]{2}$/.test(savedCountry) ? savedCountry : data.countryCode || "US";
        setCountryCodeState(selectedCountry);
        setTemperatureUnit(fahrenheitCountries.has(selectedCountry) ? "fahrenheit" : "celsius");
        if (!window.localStorage.getItem("connect-language")) {
          const preferredLanguage = countryLanguage[selectedCountry] || data.language;
          if (preferredLanguage && languages.some(item => item.code === preferredLanguage)) setLanguageState(preferredLanguage as LanguageCode);
        }
      }).catch(() => {
        if (!active) return;
        setTemperatureUnit("fahrenheit");
      }).finally(() => { if (active) setRegionReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!regionReady) return;
    const selected = languages.find(item => item.code === language) ?? languages[0];
    document.documentElement.lang = language;
    document.documentElement.dir = selected.dir;
    try { window.localStorage.setItem("connect-language", language); } catch { /* Session-only preference. */ }
  }, [language, regionReady]);

  const setCountryCode = (value: string) => {
    const next = /^[A-Z]{2}$/.test(value) ? value : "US";
    setCountryCodeState(next);
    setTemperatureUnit(fahrenheitCountries.has(next) ? "fahrenheit" : "celsius");
    try { window.localStorage.setItem("connect-country-manual", next); } catch { /* Session-only preference. */ }
    if (countryLanguage[next]) setLanguageState(countryLanguage[next]);
  };
  const countryName = regionCountries.find(item => item[0] === countryCode)?.[1] || countryCode;
  const value = useMemo<LanguageContextValue>(() => ({
    language, setLanguage: setLanguageState,
    t: (key: string) => messages[language][key] ?? messages.en[key] ?? key,
    countryCode, setCountryCode, countryName, temperatureUnit, timeZone, regionReady
  }), [language, countryCode, countryName, temperatureUnit, timeZone, regionReady]);
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
