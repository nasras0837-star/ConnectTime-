import "server-only";
import { Client, TablesDB } from "node-appwrite";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";

import type { AdultStatus, AccountStatus, MemberAccess } from "./access-policy";
import { isEligible, isMissingAccessRecord } from "./access-policy";

type AccessDecision =
  | { allowed: true; access: MemberAccess }
  | { allowed: false; status: 401 | 403 | 503; reason: "unauthenticated" | "not_eligible" | "not_configured" | "access_unavailable" };

// The member_access table is created in the existing APPWRITE_DATABASE_ID database.
// Keeping its ID fixed avoids adding another Render environment variable.
const MEMBER_ACCESS_TABLE_ID = "member_access";

export async function checkMemberAccess(): Promise<AccessDecision> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    return { allowed: false, status: 503, reason: "not_configured" };
  }

  try {
    const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
    if (!user) return { allowed: false, status: 401, reason: "unauthenticated" };

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const tables = new TablesDB(client);
    const row = await tables.getRow({
      databaseId,
      tableId: MEMBER_ACCESS_TABLE_ID,
      rowId: user.$id
    });
    const access = {
      adult_status: row.adult_status as AdultStatus,
      account_status: row.account_status as AccountStatus
    };
    if (!isEligible(access)) return { allowed: false, status: 403, reason: "not_eligible" };
    return { allowed: true, access };
  } catch (error) {
    // A first-time member has no row until verification; keep access denied.
    if (isMissingAccessRecord(error)) return { allowed: false, status: 403, reason: "not_eligible" };
    // Appwrite outages, invalid credentials, and malformed data must never grant access.
    return { allowed: false, status: 503, reason: "access_unavailable" };
  }
}
