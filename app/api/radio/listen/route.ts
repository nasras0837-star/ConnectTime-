import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const uuid = new URL(request.url).searchParams.get("uuid") || "";
  if (!uuidPattern.test(uuid)) return NextResponse.json({ error: "Choose a valid radio station." }, { status: 400 });
  try {
    // Radio Browser's click endpoint records a listen and resolves the station stream URL.
    const response = await fetch("https://de1.api.radio-browser.info/json/url/" + encodeURIComponent(uuid), {
      headers: { "User-Agent": "ConnectTime/1.0 (community radio directory)", Accept: "application/json" },
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Radio stream lookup failed");
    const data = await response.json() as { url?: string; name?: string };
    if (!data.url) return NextResponse.json({ error: "This station has no active stream URL." }, { status: 404 });
    const stream = new URL(data.url);
    if (stream.protocol !== "https:") return NextResponse.json({ error: "This station only provides an insecure stream, which browsers may block. Choose another station." }, { status: 422 });
    return NextResponse.json({ url: stream.toString(), name: data.name || "Radio station" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The station could not be reached. Please choose another stream." }, { status: 503 });
  }
}
