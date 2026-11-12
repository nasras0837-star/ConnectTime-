export type VerificationDecision = {
  recordStatus: "verified" | "failed" | "review";
  adultStatus: "verified" | "rejected" | "review";
};

export function calculateAge(dateOfBirth: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  let age = today.getUTCFullYear() - year;
  const birthdayPassed = today.getUTCMonth() + 1 > month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  if (!birthdayPassed) age--;
  return age;
}

export function resolveVerificationDecision(
  decision: string,
  dateOfBirth: string | null | undefined,
  today = new Date(),
): VerificationDecision {
  const normalized = decision.toLowerCase();
  if (normalized === "approved") {
    const age = dateOfBirth ? calculateAge(dateOfBirth, today) : null;
    if (age !== null && age >= 18) return { recordStatus: "verified", adultStatus: "verified" };
    if (age !== null && age < 18) return { recordStatus: "failed", adultStatus: "rejected" };
    return { recordStatus: "review", adultStatus: "review" };
  }
  if (["declined", "expired", "abandoned"].includes(normalized)) {
    return { recordStatus: "failed", adultStatus: "rejected" };
  }
  return { recordStatus: "review", adultStatus: "review" };
}

export function resolveStoredVerificationStatus(status: string): VerificationDecision | null {
  if (status === "verified") return { recordStatus: "verified", adultStatus: "verified" };
  if (status === "failed") return { recordStatus: "failed", adultStatus: "rejected" };
  if (status === "review") return { recordStatus: "review", adultStatus: "review" };
  return null;
}
