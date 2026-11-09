export type AuthOriginInput = {
  requestUrl: string;
  origin: string | null;
  fetchSite: string | null;
  allowedOrigins?: string;
};

/**
 * Allow same-origin authentication on every deployment environment and
 * explicitly allow additional exact test/preview origins. Reject cross-site
 * fetches and never use wildcard or suffix matching.
 */
export function isTrustedAuthMutation(input: AuthOriginInput): boolean {
  if (input.fetchSite === "cross-site") return false;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(input.requestUrl).origin;
  } catch {
    return false;
  }

  const trusted = new Set<string>([requestOrigin]);
  for (const candidate of (input.allowedOrigins ?? "").split(",")) {
    const value = candidate.trim();
    if (!value) continue;
    try {
      trusted.add(new URL(value).origin);
    } catch {
      // Ignore malformed optional origins.
    }
  }

  if (!input.origin) return input.fetchSite === "same-origin";
  try {
    return trusted.has(new URL(input.origin).origin);
  } catch {
    return false;
  }
}
