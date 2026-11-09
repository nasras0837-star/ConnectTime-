export type AuthOriginInput = {
  requestUrl: string;
  origin: string | null;
  fetchSite: string | null;
  requestHost?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  allowedOrigins?: string;
};

/**
 * Trust requests whose browser Origin exactly matches the externally visible
 * host serving this request. Render and other reverse proxies can make
 * request.url reflect an internal origin, so prefer forwarded host/protocol
 * (then Host) over the internal URL. Extra test/preview origins can be listed
 * as exact origins in APP_ALLOWED_ORIGINS.
 */
export function isTrustedAuthMutation(input: AuthOriginInput): boolean {
  const trusted = new Set<string>();

  const externalHost = input.forwardedHost?.split(",")[0]?.trim()
    || input.requestHost?.split(",")[0]?.trim();
  const externalProto = input.forwardedProto?.split(",")[0]?.trim()
    || (() => {
      try { return new URL(input.requestUrl).protocol.replace(":", ""); }
      catch { return ""; }
    })();

  if (externalHost && (externalProto === "https" || externalProto === "http")) {
    try {
      trusted.add(new URL(`${externalProto}://${externalHost}`).origin);
    } catch {
      // Ignore malformed proxy headers; exact request URL remains a fallback.
    }
  }

  try {
    trusted.add(new URL(input.requestUrl).origin);
  } catch {
    if (!trusted.size) return false;
  }

  for (const candidate of (input.allowedOrigins ?? "").split(",")) {
    const value = candidate.trim();
    if (!value) continue;
    try {
      trusted.add(new URL(value).origin);
    } catch {
      // Ignore malformed optional origins.
    }
  }

  if (!input.origin) {
    return input.fetchSite === "same-origin" || input.fetchSite === "same-site";
  }

  try {
    // Origin is browser-controlled and cannot be forged by a cross-origin
    // page. Exact origin matching is the security boundary; Fetch Metadata
    // can report "cross-site" behind proxies even for a legitimate deployment.
    return trusted.has(new URL(input.origin).origin);
  } catch {
    return false;
  }
}
