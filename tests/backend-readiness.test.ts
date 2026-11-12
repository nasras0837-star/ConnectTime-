import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getAuthStatus } from "../app/api/auth/status/route";
import { GET as getHealth } from "../app/api/health/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("backend readiness endpoints", () => {
  it("returns 503 when required Appwrite configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "");
    vi.stubEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID", "");
    vi.stubEnv("APPWRITE_API_KEY", "");

    const response = await getAuthStatus();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.configured).toBe(false);
    expect(body.missing).toContain("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    expect(body.missing).toContain("APPWRITE_API_KEY");
  });

  it("keeps process health independent from Appwrite availability", async () => {
    const response = await getHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
