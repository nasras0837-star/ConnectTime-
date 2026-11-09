import { describe, expect, it } from "vitest";
import { isTrustedAuthMutation } from "../lib/auth-origin";

const renderProxy = {
  requestUrl: "http://10.25.129.40:10000/api/appwrite/account/sessions/email",
  requestHost: "10.25.129.40:10000",
  forwardedHost: "connect-web-7ypt.onrender.com",
  forwardedProto: "https",
};

describe("authentication request origin policy", () => {
  it.each(["production", "test", "preview", "development"])(
    "accepts same-origin authentication in %s",
    () => {
      expect(isTrustedAuthMutation({
        requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite/account/sessions/email",
        origin: "https://connect-web-7ypt.onrender.com",
        fetchSite: "same-origin",
      })).toBe(true);
    },
  );

  it("accepts the public Render origin when the app sees an internal proxy URL", () => {
    expect(isTrustedAuthMutation({
      ...renderProxy,
      origin: "https://connect-web-7ypt.onrender.com",
      fetchSite: "cross-site",
    })).toBe(true);
  });

  it("accepts a host-matched test or preview deployment without a hard-coded hostname", () => {
    expect(isTrustedAuthMutation({
      requestUrl: "http://10.0.0.2:3000/api/appwrite",
      requestHost: "10.0.0.2:3000",
      forwardedHost: "connecttime-pr-123.onrender.com",
      forwardedProto: "https",
      origin: "https://connecttime-pr-123.onrender.com",
      fetchSite: "same-site",
    })).toBe(true);
  });

  it("accepts an explicitly configured test origin", () => {
    expect(isTrustedAuthMutation({
      requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite",
      origin: "https://connecttime-test.example.com",
      fetchSite: "same-site",
      allowedOrigins: "https://connecttime-test.example.com, https://preview.example.com",
    })).toBe(true);
  });

  it("rejects unrelated origins", () => {
    expect(isTrustedAuthMutation({
      ...renderProxy,
      origin: "https://attacker.example",
      fetchSite: "cross-site",
    })).toBe(false);
  });

  it("rejects suffix and wildcard lookalikes", () => {
    expect(isTrustedAuthMutation({
      requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite",
      origin: "https://connect-web-7ypt.onrender.com.attacker.example",
      fetchSite: "same-site",
      allowedOrigins: "*.onrender.com",
    })).toBe(false);
  });

  it("fails closed when Origin is missing unless Fetch Metadata confirms same-site", () => {
    expect(isTrustedAuthMutation({
      requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite",
      origin: null,
      fetchSite: "same-origin",
    })).toBe(true);
    expect(isTrustedAuthMutation({
      requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite",
      origin: null,
      fetchSite: null,
    })).toBe(false);
  });
});
