import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const allowedOrigin = "https://nasras0837-star.github.io";

function corsHeaders(origin: string | null) {
  const headers = new Headers({
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    "Vary": "Origin",
  });
  if (origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (origin && origin !== allowedOrigin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403, headers });
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.replace(/\/$/, "");
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return NextResponse.json({ error: "Member count is not configured." }, { status: 503, headers });
  }

  try {
    const query = encodeURIComponent(JSON.stringify({ method: "limit", values: [1] }));
    const response = await fetch(`${endpoint}/users?queries[]=${query}`, {
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Member count is temporarily unavailable." }, { status: 502, headers });
    }

    const data = await response.json() as { total?: unknown };
    if (typeof data.total !== "number" || !Number.isFinite(data.total) || data.total < 0) {
      return NextResponse.json({ error: "Member count response was invalid." }, { status: 502, headers });
    }

    return NextResponse.json({ count: data.total }, { headers });
  } catch {
    return NextResponse.json({ error: "Member count is temporarily unavailable." }, { status: 502, headers });
  }
}
