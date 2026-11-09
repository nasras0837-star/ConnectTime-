import { describe, expect, it } from "vitest";
import { isTrustedAuthMutation } from "../lib/auth-origin";

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
      requestUrl: "https://connect-web-7ypt.onrender.com/api/appwrite",
      origin: "https://attacker.example",
      fetchSite: "cross-site",
      allowedOrigins: "https://connecttime-test.example.com",
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

  it("fails closed when Origin is missing unless Fetch Metadata confirms same-origin", () => {
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
