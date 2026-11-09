import { describe, expect, it } from "vitest";
import { isConfiguredAdminUserId } from "../lib/admin-policy";

describe("Connect admin allowlist", () => {
  it("allows only an exact configured Appwrite user ID", () => {
    expect(isConfiguredAdminUserId("staff-123", "other, staff-123,staff-456")).toBe(true);
  });
  it("denies IDs not present in the allowlist", () => {
    expect(isConfiguredAdminUserId("staff-12", "staff-123,staff-456")).toBe(false);
  });
  it("denies blank IDs and empty allowlists", () => {
    expect(isConfiguredAdminUserId("", "staff-123")).toBe(false);
    expect(isConfiguredAdminUserId("staff-123", "")).toBe(false);
  });
  it("does not treat substrings as administrator IDs", () => {
    expect(isConfiguredAdminUserId("staff", "staff-123")).toBe(false);
  });
});
