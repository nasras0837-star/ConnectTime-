import "server-only";
import { Client, Databases } from "node-appwrite";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";

export type AdultStatus = "pending" | "verified" | "rejected" | "review";
export type AccountStatus = "pending" | "active" | "suspended" | "banned";
export type MemberAccess = { adult_status: AdultStatus; account_status: AccountStatus };

export type AccessDecision =
  | { allowed: true; access: MemberAccess }
  | { allowed: false; status: 401 | 403 | 503; reason: "unauthenticated" | "not_eligible" | "not_configured" | "access_unavailable" };

export function isEligible(access: Partial<MemberAccess> | null | undefined): access is MemberAccess {
  return access?.adult_status === "verified" && access?.account_status === "active";
}

export async function checkMemberAccess(): Promise<AccessDecision> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const collectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId) {
    return { allowed: false, status: 503, reason: "not_configured" };
  }

  try {
    const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
    if (!user) return { allowed: false, status: 401, reason: "unauthenticated" };

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);
    const doc = await databases.getDocument(databaseId, collectionId, user.$id);
    const access = { adult_status: doc.adult_status as AdultStatus, account_status: doc.account_status as AccountStatus };
    if (!isEligible(access)) return { allowed: false, status: 403, reason: "not_eligible" };
    return { allowed: true, access };
  } catch {
    // Missing record, Appwrite outage, invalid credentials, or malformed data must never grant access.
    return { allowed: false, status: 503, reason: "access_unavailable" };
  }
}
