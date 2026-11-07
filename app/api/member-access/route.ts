import { NextResponse } from "next/server";
import { checkMemberAccess } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const decision = await checkMemberAccess();
  if (!decision.allowed) {
    return NextResponse.json({ authorized: false, reason: decision.reason }, { status: decision.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ authorized: true, adultStatus: "verified", accountStatus: "active" }, { headers: { "Cache-Control": "no-store" } });
}
