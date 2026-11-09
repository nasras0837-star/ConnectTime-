import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("security response headers", () => {
  it("sets baseline browser security headers", async () => {
    const entries = await nextConfig.headers?.();
    expect(entries).toBeDefined();
    const headers = new Map(entries?.[0].headers.map(({ key, value }) => [key.toLowerCase(), value]));
    expect(headers.get("content-security-policy")).toContain("object-src 'none'");
    expect(headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("content-security-policy")).toContain("upgrade-insecure-requests");
    expect(headers.get("content-security-policy")).toContain("https://*.cloud.appwrite.io");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-permitted-cross-domain-policies")).toBe("none");
    expect(headers.get("origin-agent-cluster")).toBe("?1");
    expect(headers.get("cross-origin-opener-policy")).toBe("same-origin-allow-popups");
    expect(headers.get("content-security-policy")).toContain("https://www.youtube-nocookie.com");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("permissions-policy")).toContain("geolocation=()");
    expect(headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(entries?.some(entry => entry.source === "/account/:path*" && entry.headers.some(header => header.key === "Cache-Control" && header.value.includes("no-store")))).toBe(true);
    expect(entries?.some(entry => entry.source === "/api/:path*" && entry.headers.some(header => header.key === "Cache-Control" && header.value === "no-store"))).toBe(true);
  });
});
