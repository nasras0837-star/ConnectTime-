import { NextResponse } from "next/server";

const ACCEPT_LANGUAGE_COUNTRIES: Record<string, string> = {
  "en-gb":"GB","en-au":"AU","en-ca":"CA","en-in":"IN","en-nz":"NZ","en-ie":"IE","en-za":"ZA","en-ng":"NG",
  "es-es":"ES","es-mx":"MX","es-ar":"AR","es-cl":"CL","es-co":"CO","fr-fr":"FR","fr-ca":"CA","de-de":"DE",
  "pt-br":"BR","pt-pt":"PT","ja-jp":"JP","zh-cn":"CN","zh-tw":"TW","ko-kr":"KR","hi-in":"IN","ar-sa":"SA",
  "ar-ae":"AE","ur-pk":"PK","id-id":"ID","th-th":"TH","ms-my":"MY","it-it":"IT","nl-nl":"NL","sv-se":"SE"
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = request.headers;
  const edgeCountry = (
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("x-forwarded-country") ||
    headers.get("x-geo-country") ||
    headers.get("cloudfront-viewer-country") ||
    ""
  ).toUpperCase();
  const accepted = (headers.get("accept-language") || "").split(",").map(part => part.split(";")[0].trim().toLowerCase());
  const localeCountry = accepted.map(locale => ACCEPT_LANGUAGE_COUNTRIES[locale]).find(Boolean) || "";
  const countryCode = /^[A-Z]{2}$/.test(edgeCountry) && edgeCountry !== "XX" ? edgeCountry : localeCountry || "US";
  const language = accepted.map(locale => locale.split("-")[0]).find(code => ["en","es","fr","ar","pt","hi","zh","ur"].includes(code)) || "en";
  const fahrenheit = ["US","BS","BZ","KY","PW","FM","MH","LR"].includes(countryCode);
  return NextResponse.json({
    countryCode,
    language,
    temperatureUnit: fahrenheit ? "fahrenheit" : "celsius",
    detectedBy: edgeCountry ? "edge-country-header" : localeCountry ? "browser-language-fallback" : "default",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
