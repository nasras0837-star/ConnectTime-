import "server-only";
import { currentCommunityMember } from "@/lib/community-safety";
import { isConfiguredAdminUserId } from "@/lib/admin-policy";

/**
 * Administrative access is granted only to explicitly configured Appwrite user IDs.
 * No client-provided role, profile field, or email address is trusted.
 */
export async function currentConnectAdmin() {
  const user = await currentCommunityMember();
  if (!user || !isConfiguredAdminUserId(user.$id, process.env.CONNECT_ADMIN_USER_IDS || "")) return null;
  return user;
}

export function isAdminAllowlistConfigured() {
  return Boolean(process.env.CONNECT_ADMIN_USER_IDS?.split(",").some(value => value.trim()));
}
