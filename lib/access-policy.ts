export type AdultStatus = "pending" | "verified" | "rejected" | "review";
export type AccountStatus = "pending" | "active" | "suspended" | "banned";
export type MemberAccess = { adult_status: AdultStatus; account_status: AccountStatus };

export function isActiveMember(access: Partial<MemberAccess> | null | undefined): boolean {
  return access?.account_status === "active";
}

export function isEligible(access: Partial<MemberAccess> | null | undefined): access is MemberAccess {
  return access?.adult_status === "verified" && access?.account_status === "active";
}

/** A missing access document means the member is not yet eligible, not that Appwrite is unavailable. */
export function isMissingAccessRecord(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 404;
}
