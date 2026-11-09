import { NextResponse } from "next/server";
import { Client, Databases, Query, Storage } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const viewer = await currentCommunityMember();
  if (!viewer) return NextResponse.json({ error: "Sign in to view member photos." }, { status: 401 });
  const viewerAccess = await checkMemberAccess();
  if (!viewerAccess.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: viewerAccess.status });

  try {
    const { fileId } = await params;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(fileId)) return new NextResponse("Not found", { status: 404 });
    const bucketId = process.env.APPWRITE_PROFILE_PHOTOS_BUCKET_ID;
    const profileTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
    const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
    const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!bucketId || !profileTableId || !blocksTableId || !accessDatabaseId || !accessCollectionId || !endpoint || !projectId || !apiKey) throw new Error("Photo access is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const rows = await tablesDB.listRows({ databaseId, tableId: profileTableId, queries: [Query.equal("photo_file_id", [fileId]), Query.limit(1)] });
    const profile = rows.rows[0];
    if (!profile || !profile.user_id) return new NextResponse("Not found", { status: 404 });
    const ownerId = String(profile.user_id);
    if (ownerId !== viewer.$id && !["public", "members"].includes(String(profile.visibility))) return new NextResponse("Not found", { status: 404 });

    if (ownerId !== viewer.$id) {
      const [outgoing, incoming] = await Promise.all([
        tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocker_user_id", viewer.$id), Query.equal("blocked_user_id", ownerId), Query.limit(1)] }),
        tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocker_user_id", ownerId), Query.equal("blocked_user_id", viewer.$id), Query.limit(1)] })
      ]);
      if (outgoing.rows.length || incoming.rows.length) return new NextResponse("Not found", { status: 404 });
      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
      const eligibility = await new Databases(client).getDocument(accessDatabaseId, accessCollectionId, ownerId);
      if (!isEligible({ adult_status: eligibility.adult_status, account_status: eligibility.account_status })) return new NextResponse("Not found", { status: 404 });
    }

    const storage = new Storage(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
    const bytes = await storage.getFileView({ bucketId, fileId });
    const mime = ["image/jpeg", "image/png", "image/webp"].includes(String(profile.photo_mime_type)) ? String(profile.photo_mime_type) : "application/octet-stream";
    return new Response(bytes, { headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=300, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Cookie"
    }});
  } catch (error) {
    console.error("Profile photo view failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Photo unavailable", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
