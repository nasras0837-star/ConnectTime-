import { NextResponse } from "next/server";
import { checkMemberAccess } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkMemberAccess();

  if (!result.allowed) {
    if (result.reason === "unauthenticated") {
      return NextResponse.json(
        { status: "unauthenticated" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (result.reason === "not_eligible") {
      return NextResponse.json(
        { adultStatus: "pending", accountStatus: "pending" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { adultStatus: "verified", accountStatus: "active" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
