import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const required = [
    ["NEXT_PUBLIC_APPWRITE_ENDPOINT", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT],
    ["NEXT_PUBLIC_APPWRITE_PROJECT_ID", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID],
    ["APPWRITE_API_KEY", process.env.APPWRITE_API_KEY],
  ] as const;
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  return NextResponse.json(
    { configured: missing.length === 0, missing },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
