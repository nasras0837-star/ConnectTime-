import { NextResponse } from "next/server";
import { Query, Storage } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember } from "@/lib/community-safety";
import { Client } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to listen to Connect Podcasts." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const { fileId } = await context.params;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const bucketId = process.env.APPWRITE_PODCASTS_BUCKET_ID;
    const episodesTableId = process.env.APPWRITE_PODCAST_EPISODES_TABLE_ID;
    if (!endpoint || !projectId || !apiKey || !bucketId || !episodesTableId) throw new Error("Podcast storage is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const matches = await tablesDB.listRows({ databaseId, tableId: episodesTableId, queries: [Query.equal("$id", fileId), Query.limit(1)] });
    const episode = matches.rows[0];
    if (!episode) return NextResponse.json({ error: "Episode not found." }, { status: 404 });
    if (String(episode.status) !== "published" && String(episode.creator_user_id) !== user.$id) return NextResponse.json({ error: "This episode is not published yet." }, { status: 403 });
    const storage = new Storage(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
    const audio = await storage.getFileView({ bucketId, fileId: String(episode.audio_file_id) });
    return new Response(audio, { headers: {
      "Content-Type": String(episode.audio_mime_type || "audio/mpeg"),
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Podcast audio delivery failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Audio is temporarily unavailable." }, { status: 503 });
  }
}
