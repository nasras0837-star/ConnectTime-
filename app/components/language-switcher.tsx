"use client";
import { useSyncExternalStore } from "react";
import { languages } from "@/lib/i18n";
import { regionCountries, useLanguage } from "./language-provider";

type WidgetMode = "expanded" | "minimized" | "hidden" | "closed";
const STORAGE_KEY = "connect-region-widget-mode";
const shell: React.CSSProperties = { position: "fixed", left: 18, bottom: 18, zIndex: 2147483000, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", maxWidth: "calc(100vw - 24px)", padding: "12px 48px 12px 14px", border: "1px solid #3979c7", borderRadius: 18, background: "#061638", color: "#fff", boxShadow: "0 10px 34px rgba(0,0,0,.5)", fontFamily: "Arial,sans-serif" };
const action: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 30, height: 30, padding: "0 8px", border: "1px solid #5b91d2", borderRadius: 8, background: "#12366c", color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1, cursor: "pointer" };
const picker: React.CSSProperties = { maxWidth: 150, minHeight: 38, padding: "7px 10px", border: "1px solid #4d82c2", borderRadius: 10, background: "#102b55", color: "#fff", fontWeight: 700, fontSize: 14 };
export function LanguageSwitcher() {
  const { language, setLanguage, t, countryCode, setCountryCode } = useLanguage();
  const mode = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener("connect-region-widget-mode", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("connect-region-widget-mode", notify);
      };
    },
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "minimized" || saved === "hidden" || saved === "closed" ? saved : "expanded";
      } catch { return "expanded"; }
    },
    () => "expanded",
  );
  const changeMode = (next: WidgetMode) => {
    try {
      if (next === "expanded") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    window.dispatchEvent(new Event("connect-region-widget-mode"));
  };
  const reopenStyle: React.CSSProperties = { ...action, position: "fixed", left: 18, bottom: 18, zIndex: 2147483000, minHeight: 42, padding: "9px 14px", borderRadius: 13, background: "#061638", fontSize: 13 };
  if (mode === "closed") return <button type="button" style={{ ...reopenStyle, width: 44, height: 44, borderRadius: "50%", padding: 0 }} onClick={() => changeMode("expanded")} aria-label="Reopen region and language settings" title="Region and language settings">🌐</button>;
  if (mode === "hidden") return <button type="button" style={reopenStyle} onClick={() => changeMode("expanded")}>Show region &amp; language ↑</button>;
  if (mode === "minimized") return <div style={{ ...shell, flexWrap: "nowrap", padding: "7px 8px" }} aria-label="Region and language settings minimized">
    <button type="button" style={{ ...action, border: 0, background: "transparent", fontSize: 13 }} onClick={() => changeMode("expanded")} aria-label="Expand region and language settings">🌍 {countryCode}　🌐 {language.toUpperCase()}　⌃</button>
    <button type="button" style={action} onClick={() => changeMode("hidden")} aria-label="Hide region and language settings" title="Hide">−</button>
    <button type="button" style={action} onClick={() => changeMode("closed")} aria-label="Close region and language settings" title="Close">×</button>
  </div>;
  return <div style={shell} aria-label="Region and language settings">
    <label htmlFor="ct-region-country" style={{ color: "#fff", fontWeight: 800, whiteSpace: "nowrap" }}>🌍 Region</label>
    <select id="ct-region-country" style={picker} value={countryCode} onChange={e => setCountryCode(e.target.value)} aria-label="Choose your country or region">
      <option value="AUTO">Auto-detect</option>{regionCountries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    <label htmlFor="ct-language-select" style={{ color: "#fff", fontWeight: 800, whiteSpace: "nowrap" }}>🌐 {t("language")}</label>
    <select id="ct-language-select" style={picker} value={language} onChange={e => setLanguage(e.target.value as (typeof languages)[number]["code"])} aria-label={t("language")}>
      {languages.map(item => <option key={item.code} value={item.code}>{item.native}</option>)}
    </select>
    <div style={{ position: "absolute", right: 7, top: 7, display: "flex", gap: 4 }}>
      <button type="button" style={action} onClick={() => changeMode("minimized")} aria-label="Minimize region and language settings" title="Minimize">−</button>
      <button type="button" style={action} onClick={() => changeMode("hidden")} aria-label="Hide region and language settings" title="Hide">⌄</button>
      <button type="button" style={action} onClick={() => changeMode("closed")} aria-label="Close region and language settings" title="Close">×</button>
    </div>
  </div>;
}
