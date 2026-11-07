import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { communitySafetyStore } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function profileTable() {
  const tableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  if (!tableId) throw new Error("Profiles table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  try {
    const { tablesDB, databaseId, tableId } = profileTable();
    const row = await tablesDB.getRow({ databaseId, tableId, rowId: user.$id });
    if (row.user_id !== user.$id) return NextResponse.json({ error: "Profile ownership check failed." }, { status: 403 });
    return NextResponse.json({ profile: row }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 404) {
      return NextResponse.json({ profile: null }, { headers: { "Cache-Control": "no-store" } });
    }
    console.error("Profile lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Profile storage is not configured or is unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before saving your profile." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid profile details." }, { status: 400 }); }

  const handle = typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const region = typeof body.region === "string" ? body.region.trim() : "";
  const interests = typeof body.interests === "string" ? body.interests.split(",").map(v => v.trim()).filter(Boolean).slice(0, 12) : [];
  const visibility = typeof body.visibility === "string" ? body.visibility : "members";
  const age = body.age === undefined || body.age === null || body.age === "" ? null : Number(body.age);
  const gender = typeof body.gender === "string" ? body.gender.trim() : "";
  const interestedIn = typeof body.interestedIn === "string" ? body.interestedIn.trim() : "everyone";
  const relationshipGoal = typeof body.relationshipGoal === "string" ? body.relationshipGoal.trim() : "friendship";

  if (!/^[a-z0-9_]{3,24}$/.test(handle)) return NextResponse.json({ error: "Handle must be 3–24 characters using lowercase letters, numbers, or underscores." }, { status: 400 });
  if (!displayName || displayName.length > 80) return NextResponse.json({ error: "Display name is required and must be 80 characters or fewer." }, { status: 400 });
  if (bio.length > 500 || region.length > 100 || !country || country.length > 80) return NextResponse.json({ error: "Check your bio, country, or region fields." }, { status: 400 });
  if (interests.some(v => v.length > 32) || interests.join(",").length > 384) return NextResponse.json({ error: "Each interest must be 32 characters or fewer." }, { status: 400 });
  if (age !== null && (!Number.isInteger(age) || age < 18 || age > 110)) return NextResponse.json({ error: "Dating profiles require an age between 18 and 110." }, { status: 400 });
  if (gender && !["woman", "man", "nonbinary", "prefer_not_to_say"].includes(gender)) return NextResponse.json({ error: "Choose a valid gender option." }, { status: 400 });
  if (!["everyone", "women", "men", "nonbinary"].includes(interestedIn)) return NextResponse.json({ error: "Choose a valid partner preference." }, { status: 400 });
  if (!["serious_relationship", "dating", "friendship"].includes(relationshipGoal)) return NextResponse.json({ error: "Choose a valid relationship goal." }, { status: 400 });
  if (!["public", "members", "friends", "private"].includes(visibility)) return NextResponse.json({ error: "Choose a valid profile visibility setting." }, { status: 400 });

  try {
    const { tablesDB, databaseId, tableId } = profileTable();
    // Preflight check improves feedback; the unique database index is the
    // final protection against concurrent attempts to claim the same handle.
    const handleMatches = await tablesDB.listRows({
      databaseId,
      tableId,
      queries: [Query.equal("handle", [handle]), Query.limit(2)],
    });
    if (handleMatches.rows.some(row => row.user_id !== user.$id)) {
      return NextResponse.json({ error: "That username is already in use. Please choose another." }, { status: 409 });
    }
    const data = {
      user_id: user.$id,
      handle,
      display_name: displayName,
      bio,
      country,
      region,
      interests: interests.join(", "),
      ...(age !== null ? { age } : {}),
      ...(gender ? { gender } : {}),
      interested_in: interestedIn,
      relationship_goal: relationshipGoal,
      visibility,
      updated_at: new Date().toISOString(),
    };
    try {
      const existing = await tablesDB.getRow({ databaseId, tableId, rowId: user.$id });
      if (existing.user_id !== user.$id) return NextResponse.json({ error: "Profile ownership check failed." }, { status: 403 });
      const row = await tablesDB.updateRow({ databaseId, tableId, rowId: user.$id, data });
      return NextResponse.json({ saved: true, profile: row }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
    }
    const row = await tablesDB.createRow({ databaseId, tableId, rowId: ID.custom(user.$id), data: { ...data, created_at: new Date().toISOString() } });
    return NextResponse.json({ saved: true, profile: row }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Profile could not be saved. Check that the Appwrite profiles table and columns are configured." }, { status: 503 });
  }
}
