export type AdultStatus = "pending" | "verified" | "rejected" | "review";
export type AccountStatus = "pending" | "active" | "suspended" | "banned";
export type MemberAccess = { adult_status: AdultStatus; account_status: AccountStatus };

export function isEligible(access: Partial<MemberAccess> | null | undefined): access is MemberAccess {
  return access?.adult_status === "verified" && access?.account_status === "active";
}
