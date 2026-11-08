import { describe, expect, it } from "vitest";
import { isEligible, isMissingAccessRecord } from "../lib/access-policy";

describe("member eligibility", () => {
  it("requires verified adult AND active account", () => {
    expect(isEligible({ adult_status: "verified", account_status: "active" })).toBe(true);
  });
  it.each([
    [{ adult_status: "pending", account_status: "active" }],
    [{ adult_status: "rejected", account_status: "active" }],
    [{ adult_status: "review", account_status: "active" }],
    [{ adult_status: "verified", account_status: "pending" }],
    [{ adult_status: "verified", account_status: "suspended" }],
    [{ adult_status: "verified", account_status: "banned" }],
    [null],
    [undefined],
    [{}],
  ])("denies incomplete or non-active access records", (record) => {
    expect(isEligible(record as never)).toBe(false);
  });
});

describe("missing member-access record handling", () => {
  it("treats Appwrite 404 as a missing first-time member record", () => {
    expect(isMissingAccessRecord({ code: 404 })).toBe(true);
  });
  it("does not classify other Appwrite failures as a missing record", () => {
    expect(isMissingAccessRecord({ code: 500 })).toBe(false);
    expect(isMissingAccessRecord(new Error("network unavailable"))).toBe(false);
    expect(isMissingAccessRecord(null)).toBe(false);
  });
});
