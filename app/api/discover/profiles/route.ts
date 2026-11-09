import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function preferenceAllows(preference: unknown, gender: unknown) {
  const choice = String(preference || "everyone").toLowerCase();
  const value = String(gender || "").toLowerCase();
  if (!choice || choice === "everyone" || choice === "any") return true;
  if (choice === "women" || choice === "woman") return value === "woman";
  if (choice === "men" || choice === "man") return value === "man";
  if (choice === "nonbinary" || choice === "non-binary") return value === "nonbinary";
  return true;
}

export async function GET(request: Request) {
  const viewer = await currentCommunityMember();
  if (!viewer) return NextResponse.json({ error: "Sign in to discover members." }, { status: 401 });
  const viewerAccess = await checkMemberAccess();
  if (!viewerAccess.allowed) return NextResponse.json({ error: "Verified adult membership is required to discover profiles." }, { status: viewerAccess.status });

  const url = new URL(request.url);
  const search = (url.searchParams.get("q") || "").trim().slice(0, 60).toLowerCase();
  const country = (url.searchParams.get("country") || "").trim().slice(0, 80).toLowerCase();
  const interest = (url.searchParams.get("interest") || "").trim().slice(0, 32).toLowerCase();
  try {
    const profileTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
    const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
    const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!profileTableId || !blocksTableId || !accessDatabaseId || !accessCollectionId || !endpoint || !projectId || !apiKey) {
      throw new Error("Profile discovery storage is not fully configured.");
    }
    const { tablesDB, databaseId } = communitySafetyStore();
    const [profiles, outgoingBlocks, incomingBlocks, viewerProfiles] = await Promise.all([
      tablesDB.listRows({ databaseId, tableId: profileTableId, queries: [Query.equal("visibility", ["public", "members"]), Query.orderDesc("$updatedAt"), Query.limit(100)] }),
      tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocker_user_id", viewer.$id), Query.limit(500)] }),
      tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocked_user_id", viewer.$id), Query.limit(500)] })
    ]);
    const blocked = new Set<string>([
      ...outgoingBlocks.rows.map(row => String(row.blocked_user_id || "")),
      ...incomingBlocks.rows.map(row => String(row.blocker_user_id || ""))
    ]);
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);
    const viewerProfile = viewerProfiles.rows[0];
    const viewerInterests = String(viewerProfile?.interests || "").split(",").map((item: string) => item.trim().toLowerCase()).filter(Boolean);
    const candidates = profiles.rows.filter(row => row.user_id && row.user_id !== viewer.$id && !blocked.has(String(row.user_id)));
    const eligible = await Promise.all(candidates.map(async row => {
      try {
        const access = await databases.getDocument(accessDatabaseId, accessCollectionId, String(row.user_id));
        if (!isEligible({ adult_status: access.adult_status, account_status: access.account_status })) return null;
        const publicProfile = {
          handle: String(row.handle || ""),
          displayName: String(row.display_name || ""),
          bio: String(row.bio || ""),
          country: String(row.country || ""),
          region: String(row.region || ""),
          interests: String(row.interests || "").split(",").map((item: string) => item.trim()).filter(Boolean), age: Number(row.age || 0), gender: String(row.gender || ""), relationshipGoal: String(row.relationship_goal || ""),
        };
        if (!publicProfile.handle || !publicProfile.displayName || publicProfile.age < 18 || !publicProfile.gender) return null;
        // Discovery honors both members' stated dating preferences.
        if (!preferenceAllows(viewerProfile?.interested_in, publicProfile.gender)) return null;
        if (!preferenceAllows(row.interested_in, viewerProfile?.gender)) return null;
        if (country && !publicProfile.country.toLowerCase().includes(country)) return null;
        if (interest && !publicProfile.interests.some((item: string) => item.toLowerCase().includes(interest))) return null;
        if (search && ![publicProfile.handle, publicProfile.displayName, publicProfile.bio, publicProfile.country, publicProfile.region, ...publicProfile.interests].some(value => value.toLowerCase().includes(search))) return null;
        return publicProfile;
      } catch {
        // Missing or unreadable eligibility records never make a profile discoverable.
        return null;
      }
    }));
    return NextResponse.json({ profiles: eligible.filter(Boolean).sort((left, right) => (right?.matchScore || 0) - (left?.matchScore || 0)).slice(0, 60) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile discovery failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Profile discovery is not configured or is temporarily unavailable." }, { status: 503 });
  }
}
