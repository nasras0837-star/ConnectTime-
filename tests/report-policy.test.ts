import { describe, expect, it } from "vitest";
import { validateReportInput } from "../lib/report-policy";

const base = { category: "harassment", targetType: "member", targetUserId: "member-2", contentReference: "", details: "Repeated unwanted contact", reporterUserId: "member-1" };

describe("community report validation", () => {
  it("accepts a well-formed member report", () => expect(validateReportInput(base)).toBe(true));
  it("requires a member ID for member reports", () => expect(validateReportInput({ ...base, targetUserId: "" })).toBe(false));
  it("requires a content reference for post and message reports", () => {
    expect(validateReportInput({ ...base, targetType: "post", targetUserId: "", contentReference: "" })).toBe(false);
    expect(validateReportInput({ ...base, targetType: "message", targetUserId: "", contentReference: "message-7" })).toBe(true);
  });
  it("rejects self-reports, unsupported categories and short details", () => {
    expect(validateReportInput({ ...base, targetUserId: "member-1" })).toBe(false);
    expect(validateReportInput({ ...base, category: "invalid" })).toBe(false);
    expect(validateReportInput({ ...base, details: "too short" })).toBe(false);
  });
});
