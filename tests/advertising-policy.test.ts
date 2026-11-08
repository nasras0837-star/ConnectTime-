import { describe, expect, it } from "vitest";
import { canEnterHumanReviewQueue } from "../lib/advertising-policy";

describe("advertising campaign screening gate", () => {
  it("allows only ads that passed the initial screen and confirmed creative rights", () => {
    expect(canEnterHumanReviewQueue({ status: "manual_review_required", rights_confirmed: true })).toBe(true);
  });

  it.each([
    { status: "rejected", rights_confirmed: true },
    { status: "manual_review_required", rights_confirmed: false },
    { status: "pending", rights_confirmed: true },
    { status: "approved", rights_confirmed: true },
    { status: undefined, rights_confirmed: true },
    { status: "manual_review_required", rights_confirmed: undefined },
    {},
    null,
    undefined,
  ])("rejects submissions that do not meet both requirements", (record) => {
    expect(canEnterHumanReviewQueue(record as never)).toBe(false);
  });
});
