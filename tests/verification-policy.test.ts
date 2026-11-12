import { describe, expect, it } from "vitest";
import {
  calculateAge,
  resolveStoredVerificationStatus,
  resolveVerificationDecision,
} from "../lib/verification-policy";

describe("age verification policy", () => {
  const today = new Date("2026-11-11T12:00:00.000Z");

  it("calculates an adult age when the birthday has passed", () => {
    expect(calculateAge("2008-11-10", today)).toBe(18);
  });

  it("does not count someone as 18 before their birthday", () => {
    expect(calculateAge("2008-11-12", today)).toBe(17);
  });

  it("rejects under-18 users even when the provider says approved", () => {
    expect(resolveVerificationDecision("approved", "2010-01-01", today)).toEqual({
      recordStatus: "failed",
      adultStatus: "rejected",
    });
  });

  it("verifies only approved users with a valid 18+ date of birth", () => {
    expect(resolveVerificationDecision("approved", "2000-01-01", today)).toEqual({
      recordStatus: "verified",
      adultStatus: "verified",
    });
  });

  it.each(["", "not-a-date", "2026-02-30"])(
    "sends missing or invalid birth dates to review (%s)",
    (dob) => {
      expect(resolveVerificationDecision("approved", dob, today)).toEqual({
        recordStatus: "review",
        adultStatus: "review",
      });
    },
  );

  it.each(["declined", "expired", "abandoned"])(
    "rejects provider failure status %s",
    (status) => {
      expect(resolveVerificationDecision(status, null, today)).toEqual({
        recordStatus: "failed",
        adultStatus: "rejected",
      });
    },
  );

  it("sends unknown or inconclusive provider decisions to review", () => {
    expect(resolveVerificationDecision("inconclusive", null, today)).toEqual({
      recordStatus: "review",
      adultStatus: "review",
    });
  });

  it("maps terminal stored records for safe retry reconciliation", () => {
    expect(resolveStoredVerificationStatus("verified")?.adultStatus).toBe("verified");
    expect(resolveStoredVerificationStatus("failed")?.adultStatus).toBe("rejected");
    expect(resolveStoredVerificationStatus("review")?.adultStatus).toBe("review");
    expect(resolveStoredVerificationStatus("pending")).toBeNull();
  });
});
