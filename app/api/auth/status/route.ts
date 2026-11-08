import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // The SSR sign-up/sign-in handler needs all three values. Checking only the
  // public endpoint and project ID incorrectly enabled registration when the
  // server-side API key was absent, sending users into the handler's error flow.
  const missing = [
    !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID && "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    !process.env.APPWRITE_API_KEY && "APPWRITE_API_KEY",
  ].filter((value): value is string => Boolean(value));

  return NextResponse.json(
    { configured: missing.length === 0, missing },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
