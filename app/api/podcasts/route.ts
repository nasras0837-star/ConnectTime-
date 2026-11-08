import { NextResponse } from "next/server";
import { Client, ID, InputFile, Query, Storage } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = ["Arts & culture", "Business", "Comedy", "Education", "Entertainment", "Health & wellness", "News & politics", "Science & technology", "Society & relationships", "Sports", "Storytelling"];
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

function services() {
  const showsTableId = process.env.APPWRITE_PODCASTS_TABLE_ID;
  const episodesTableId = process.env.APPWRITE_PODCAST_EPISODES_TABLE_ID;
  const bucketId = process.env.APPWRITE_PODCASTS_BUCKET_ID;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!showsTableId || !episodesTableId || !bucketId || !endpoint || !projectId || !apiKey) throw new Error("Podcast storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const storage = new Storage(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, showsTableId, episodesTableId, bucketId, storage };
}

async function member() {
  const user = await currentCommunityMember();
  if (!user) return { user: null, response: NextResponse.json({ error: "Sign in to use Connect Podcasts." }, { status: 401 }) };
  const access = await checkMemberAccess();
  if (!access.allowed) return { user: null, response: NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status }) };
  return { user, response: null };
}

export async function GET(request: Request) {
  const { user, response } = await member();
  if (response || !user) return response!;
  try {
    const s = services();
    const mine = new URL(request.url).searchParams.get("mine") === "1";
    const showsResult = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.showsTableId, queries: mine
      ? [Query.equal("creator_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(100)]
      : [Query.equal("status", "published"), Query.orderDesc("created_at"), Query.limit(100)] });
    const shows = [];
    for (const row of showsResult.rows) {
      const ownerId = String(row.creator_user_id || "");
      const episodesResult = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.episodesTableId, queries: mine && ownerId === user.$id
        ? [Query.equal("show_id", row.$id), Query.orderDesc("created_at"), Query.limit(100)]
        : [Query.equal("show_id", row.$id), Query.equal("status", "published"), Query.orderDesc("created_at"), Query.limit(100)] });
      shows.push({
        id: String(row.$id), title: String(row.title || ""), description: String(row.description || ""),
        category: String(row.category || ""), artworkUrl: String(row.artwork_url || ""),
        creatorName: String(row.creator_name || "Connect creator"), status: String(row.status || "pending_review"),
        episodes: episodesResult.rows.map(episode => ({
          id: String(episode.$id), title: String(episode.title || ""), description: String(episode.description || ""),
          duration: String(episode.duration || ""), status: String(episode.status || "pending_review"),
          audioUrl: "/api/podcasts/audio/" + encodeURIComponent(String(episode.$id)),
          createdAt: String(episode.created_at || ""),
        })),
      });
    }
    return NextResponse.json({ shows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Podcast listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Podcasts are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const { user, response } = await member();
  if (response || !user) return response!;
  try {
    const s = services();
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      if (body.action !== "create_show") return NextResponse.json({ error: "Unknown podcast action." }, { status: 400 });
      const title = clean(body.title, 90);
      const description = clean(body.description, 600);
      const category = clean(body.category, 40);
      const artworkUrl = clean(body.artworkUrl, 500);
      if (!title || !description || !categories.includes(category)) return NextResponse.json({ error: "Add a show title, description, and valid category." }, { status: 400 });
      if (artworkUrl && (!artworkUrl.startsWith("https://") || artworkUrl.length > 500)) return NextResponse.json({ error: "Artwork must use a secure HTTPS image URL." }, { status: 400 });
      const now = new Date().toISOString();
      const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.showsTableId, rowId: ID.unique(), data: {
        creator_user_id: user.$id, creator_name: clean(user.name, 70) || "Connect creator",
        title, description, category, artwork_url: artworkUrl, status: "pending_review",
        created_at: now, updated_at: now,
      } });
      return NextResponse.json({ created: true, showId: String(row.$id), message: "Your podcast show was submitted for review." }, { status: 201 });
    }

    const form = await request.formData();
    const showId = clean(form.get("showId"), 80);
    const title = clean(form.get("title"), 90);
    const description = clean(form.get("description"), 600);
    const file = form.get("audio");
    if (!(file instanceof File) || !showId || !title) return NextResponse.json({ error: "Choose a podcast show, episode title, and audio file." }, { status: 400 });
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav", "audio/webm", "audio/flac"];
    if (!allowedTypes.includes(file.type) || file.size < 1 || file.size > 40 * 1024 * 1024) return NextResponse.json({ error: "Upload an MP3, M4A, AAC, OGG, WAV, WebM, or FLAC audio file up to 40 MB." }, { status: 400 });
    const ownedShows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.showsTableId, queries: [Query.equal("$id", showId), Query.equal("creator_user_id", user.$id), Query.limit(1)] });
    if (!ownedShows.rows.length) return NextResponse.json({ error: "You can only add episodes to your own podcast shows." }, { status: 403 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "episode-audio";
    const uploaded = await s.storage.createFile({ bucketId: s.bucketId, fileId: ID.unique(), file: InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), safeName) });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.episodesTableId, rowId: ID.unique(), data: {
      show_id: showId, creator_user_id: user.$id, title, description,
      audio_file_id: uploaded.$id, audio_file_name: safeName, audio_mime_type: file.type,
      status: "pending_review", created_at: now, updated_at: now,
    } });
    return NextResponse.json({ uploaded: true, episodeId: String(row.$id), message: "Your episode was uploaded and submitted for review." }, { status: 201 });
  } catch (error) {
    console.error("Podcast submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Podcast publishing is not configured or is temporarily unavailable." }, { status: 503 });
  }
}
