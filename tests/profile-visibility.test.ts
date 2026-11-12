import { describe, expect, it } from "vitest";
import { canViewProfile } from "../lib/profile-visibility";

describe("profile visibility policy", () => {
  it("allows public and members profiles to eligible signed-in viewers", () => {
    expect(canViewProfile("public", false, false)).toBe(true);
    expect(canViewProfile("members", false, false)).toBe(true);
  });
  it("limits friends-only profiles to accepted friends and the owner", () => {
    expect(canViewProfile("friends", false, false)).toBe(false);
    expect(canViewProfile("friends", false, true)).toBe(true);
    expect(canViewProfile("friends", true, false)).toBe(true);
  });
  it("limits private profiles to the owner", () => {
    expect(canViewProfile("private", false, true)).toBe(false);
    expect(canViewProfile("private", true, false)).toBe(true);
  });
  it("denies unknown or missing visibility values", () => {
    expect(canViewProfile("", false, false)).toBe(false);
    expect(canViewProfile("unknown", true, true)).toBe(false);
  });
});
