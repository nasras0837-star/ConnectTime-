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

const countryLanguage: Record<string, LanguageCode> = { US:"en",GB:"en",CA:"en",AU:"en",NZ:"en",IE:"en",DE:"de",FR:"fr",ES:"es",IT:"en",NL:"en",PT:"pt",SE:"en",BR:"pt",MX:"es",AR:"es",CL:"es",CO:"es",IN:"hi",JP:"ja",CN:"zh",TW:"zh",KR:"ko",SG:"en",MY:"en",ID:"en",TH:"en",ZA:"en",NG:"en",KE:"en",UG:"en",AE:"ar",SA:"ar",QA:"ar",PK:"ur" };
const fahrenheitCountries = new Set(["US","BS","BZ","KY","PW","FM","MH","LR"]);
const TIMEZONE_COUNTRY: Record<string,string> = {"America/New_York":"US","America/Chicago":"US","America/Denver":"US","America/Los_Angeles":"US","America/Toronto":"CA","America/Vancouver":"CA","Europe/London":"GB","Europe/Dublin":"IE","Europe/Berlin":"DE","Europe/Paris":"FR","Europe/Madrid":"ES","Europe/Rome":"IT","Europe/Amsterdam":"NL","Europe/Lisbon":"PT","Europe/Stockholm":"SE","Australia/Sydney":"AU","Australia/Perth":"AU","Pacific/Auckland":"NZ","Asia/Tokyo":"JP","Asia/Kolkata":"IN","Asia/Shanghai":"CN","Asia/Taipei":"TW","Asia/Seoul":"KR","Asia/Singapore":"SG","Asia/Kuala_Lumpur":"MY","Asia/Jakarta":"ID","Asia/Bangkok":"TH","Africa/Johannesburg":"ZA","Africa/Lagos":"NG","Africa/Nairobi":"KE","Africa/Kampala":"UG","Asia/Dubai":"AE","Asia/Riyadh":"SA","Asia/Qatar":"QA","Asia/Karachi":"PK","America/Sao_Paulo":"BR","America/Mexico_City":"MX","America/Argentina/Buenos_Aires":"AR","America/Santiago":"CL","America/Bogota":"CO"};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [countryCode, setCountryCodeState] = useState("US");
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [timeZone, setTimeZone] = useState("UTC");
  const [regionReady, setRegionReady] = useState(false);

  useEffect(() => {
    let active = true;
    let browserTimeZone = "UTC";
    try {
      const savedLanguage = window.localStorage.getItem("connect-language");
      const savedCountry = window.localStorage.getItem("connect-country-manual");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted preferences after client hydration.
      if (savedLanguage && languages.some(item => item.code === savedLanguage)) setLanguageState(savedLanguage as LanguageCode);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted preferences after client hydration.
      if (savedCountry && /^[A-Z]{2}$/.test(savedCountry)) setCountryCodeState(savedCountry);
      browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the browser time zone after hydration.
      setTimeZone(browserTimeZone);
    } catch { /* Browser privacy settings may disable local preferences. */ }
    fetch("/api/region", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        if (!active) return;
        const savedCountry = window.localStorage.getItem("connect-country-manual");
        const timezoneCountry = TIMEZONE_COUNTRY[browserTimeZone] || "";
        const detectedCountry = data.detectedBy === "default" && timezoneCountry ? timezoneCountry : data.countryCode || timezoneCountry || "US";
        const selectedCountry = savedCountry && /^[A-Z]{2}$/.test(savedCountry) ? savedCountry : detectedCountry;
        setCountryCodeState(selectedCountry);
        setTemperatureUnit(fahrenheitCountries.has(selectedCountry) ? "fahrenheit" : "celsius");
        if (!window.localStorage.getItem("connect-language")) {
          const preferredLanguage = countryLanguage[selectedCountry] || data.language;
          if (preferredLanguage && languages.some(item => item.code === preferredLanguage)) setLanguageState(preferredLanguage as LanguageCode);
        }
      }).catch(() => {
        if (!active) return;
        const fallbackCountry = TIMEZONE_COUNTRY[browserTimeZone] || "US";
        setCountryCodeState(fallbackCountry);
        setTemperatureUnit(fahrenheitCountries.has(fallbackCountry) ? "fahrenheit" : "celsius");
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
    if (value === "AUTO") {
      try { window.localStorage.removeItem("connect-country-manual"); } catch { /* Session-only automatic detection. */ }
      fetch("/api/region", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject())
        .then(data => {
          const detected = /^[A-Z]{2}$/.test(data.countryCode) ? data.countryCode : "US";
          setCountryCodeState(detected);
          setTemperatureUnit(fahrenheitCountries.has(detected) ? "fahrenheit" : "celsius");
        }).catch(() => { setCountryCodeState("US"); setTemperatureUnit("fahrenheit"); });
      return;
    }
    const next = /^[A-Z]{2}$/.test(value) ? value : "US";
    setCountryCodeState(next);
    setTemperatureUnit(fahrenheitCountries.has(next) ? "fahrenheit" : "celsius");
    try { window.localStorage.setItem("connect-country-manual", next); } catch { /* Session-only preference. */ }
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
