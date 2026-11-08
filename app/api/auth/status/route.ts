import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const missing = [
    !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID && "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  ].filter((value): value is string => Boolean(value));

  return NextResponse.json(
    { configured: missing.length === 0, missing },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
