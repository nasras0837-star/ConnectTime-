import "server-only";
import { currentCommunityMember } from "@/lib/community-safety";

/**
 * Administrative access is granted only to explicitly configured Appwrite user IDs.
 * No client-provided role, profile field, or email address is trusted.
 */
export async function currentConnectAdmin() {
  const user = await currentCommunityMember();
  if (!user) return null;
  const configured = process.env.CONNECT_ADMIN_USER_IDS;
  if (!configured) return null;
  const allowedIds = new Set(configured.split(",").map(value => value.trim()).filter(Boolean));
  return allowedIds.has(user.$id) ? user : null;
}

export function isAdminAllowlistConfigured() {
  return Boolean(process.env.CONNECT_ADMIN_USER_IDS?.split(",").some(value => value.trim()));
}
