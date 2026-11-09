import { NextResponse } from "next/server";
import { Client, ID, Storage } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function services() {
  const bucketId = process.env.APPWRITE_PROFILE_PHOTOS_BUCKET_ID;
  if (!bucketId) throw new Error("Profile photo storage bucket is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  const storage = new Storage(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { bucketId, tablesDB, databaseId, tableId: process.env.APPWRITE_PROFILES_TABLE_ID!, storage };
}

function inspectImage(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime: "image/png", ext: "png" };
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before uploading a profile photo." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required to upload a dating photo." }, { status: access.status });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PHOTO_BYTES + 256 * 1024) return NextResponse.json({ error: "Choose an image smaller than 5 MB." }, { status: 413 });
  let uploadedId = "";
  try {
    const form = await request.formData();
    const candidate = form.get("photo");
    if (!(candidate instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (candidate.size < 1 || candidate.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Choose an image smaller than 5 MB." }, { status: 413 });
    const bytes = Buffer.from(await candidate.arrayBuffer());
    const image = inspectImage(bytes);
    if (!image) return NextResponse.json({ error: "Only valid JPEG, PNG, and WebP images are supported. SVG and animated files are not accepted." }, { status: 415 });
    if (candidate.type && candidate.type !== image.mime) return NextResponse.json({ error: "The image file type does not match its contents." }, { status: 415 });

    const s = services();
    if (!s.tableId) throw new Error("Profiles table is not configured.");
    const profile = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
    if (String(profile.user_id) !== user.$id) return NextResponse.json({ error: "Profile ownership check failed." }, { status: 403 });

    const fileId = ID.unique();
    const file = await s.storage.createFile({
      bucketId: s.bucketId,
      fileId,
      file: InputFile.fromBuffer(bytes, `profile-${fileId}.${image.ext}`),
      permissions: []
    });
    uploadedId = String(file.$id);
    const oldFileId = String(profile.photo_file_id || "");
    const updated = await s.tablesDB.updateRow({
      databaseId: s.databaseId,
      tableId: s.tableId,
      rowId: user.$id,
      data: { photo_file_id: uploadedId, photo_mime_type: image.mime, photo_url: "" }
    });
    if (oldFileId && oldFileId !== uploadedId) {
      try { await s.storage.deleteFile({ bucketId: s.bucketId, fileId: oldFileId }); }
      catch (error) { console.error("Old profile photo cleanup failed", error instanceof Error ? error.message : "unknown"); }
    }
    return NextResponse.json({ uploaded: true, photoFileId: uploadedId, photoUrl: `/api/profile/photo/${uploadedId}`, profile: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (uploadedId) {
      try { const s = services(); await s.storage.deleteFile({ bucketId: s.bucketId, fileId: uploadedId }); } catch { /* Best-effort rollback. */ }
    }
    console.error("Profile photo upload failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Photo upload is unavailable. Check the private Appwrite Storage bucket and profile table configuration." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to remove your profile photo." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = services();
    if (!s.tableId) throw new Error("Profiles table is not configured.");
    const profile = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
    if (String(profile.user_id) !== user.$id) return NextResponse.json({ error: "Profile ownership check failed." }, { status: 403 });
    const fileId = String(profile.photo_file_id || "");
    await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id, data: { photo_file_id: "", photo_mime_type: "", photo_url: "" } });
    if (fileId) await s.storage.deleteFile({ bucketId: s.bucketId, fileId });
    return NextResponse.json({ removed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile photo removal failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Profile photo could not be removed." }, { status: 503 });
  }
}
