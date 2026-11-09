/** Exact Appwrite user-ID allowlist check; empty or malformed entries never grant access. */
export function isConfiguredAdminUserId(userId: string, configuredIds: string): boolean {
  if (!userId.trim()) return false;
  return configuredIds.split(",").some(value => value.trim() === userId);
}
