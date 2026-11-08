import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Client, Databases, Query, TablesDB } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Decision = { id?: string; vendorData?: string; status?: string; person?: { dateOfBirth?: string } };
type Payload = { verification?: Decision };

function ageOnDate(dateOfBirth: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  let age = today.getUTCFullYear() - year;
  const birthdayPassed = today.getUTCMonth() + 1 > month || (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  if (!birthdayPassed) age--;
  return age;
}

export async function POST(request: Request) {
  const secret = process.env.VERIFF_SHARED_SECRET;
  const signature = request.headers.get("x-hmac-signature") || request.headers.get("vrf-hmac-signature") || "";
  if (!secret || !signature) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rawBody = await request.text();
  if (rawBody.length > 256_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "hex"); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: Payload;
  try { payload = JSON.parse(rawBody) as Payload; } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const verification = payload.verification;
  const sessionId = typeof verification?.id === "string" ? verification.id : "";
  const userId = typeof verification?.vendorData === "string" ? verification.vendorData : "";
  const decision = typeof verification?.status === "string" ? verification.status.toLowerCase() : "";
  if (!sessionId || !userId || !decision) return NextResponse.json({ error: "invalid_verification_payload" }, { status: 400 });

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const recordsTableId = process.env.APPWRITE_VERIFICATION_RECORDS_TABLE_ID;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId || !recordsTableId || !accessDatabaseId || !accessCollectionId) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tables = new TablesDB(client);
  const databases = new Databases(client);
  try {
    const found = await tables.listRows({ databaseId, tableId: recordsTableId, queries: [Query.equal("provider_session_id", sessionId), Query.equal("user_id", userId), Query.equal("provider", "veriff"), Query.limit(2)] });
    if (found.rows.length !== 1) return NextResponse.json({ error: "verification_session_not_found" }, { status: 404 });
    const record = found.rows[0];
    if (record.status === "verified") return NextResponse.json({ received: true, duplicate: true });
    let status = "review";
    let adultStatus: "pending" | "verified" | "rejected" | "review" = "review";
    let accountStatus: "pending" | "active" = "pending";
    let verifiedAt: string | null = null;
    if (decision === "approved") {
      const age = typeof verification?.person?.dateOfBirth === "string" ? ageOnDate(verification.person.dateOfBirth) : null;
      if (age !== null && age >= 18) {
        status = "verified"; adultStatus = "verified"; accountStatus = "active"; verifiedAt = new Date().toISOString();
      } else if (age !== null && age < 18) {
        status = "failed"; adultStatus = "rejected";
      }
    } else if (["declined", "expired", "abandoned"].includes(decision)) {
      status = "failed"; adultStatus = "rejected";
    } else if (decision === "resubmission_requested" || decision === "review") {
      status = "review"; adultStatus = "review";
    }
    const now = new Date().toISOString();
    await tables.updateRow({ databaseId, tableId: recordsTableId, rowId: record.$id, data: { status, verified_at: verifiedAt || "", updated_at: now } });
    const access = await databases.getDocument(accessDatabaseId, accessCollectionId, userId).catch(() => null);
    if (!access) {
      await databases.createDocument(accessDatabaseId, accessCollectionId, userId, { adult_status: adultStatus, account_status: accountStatus, updated_at: now });
    } else {
      await databases.updateDocument(accessDatabaseId, accessCollectionId, userId, { adult_status: adultStatus, account_status: accountStatus, updated_at: now });
    }
    return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Veriff decision webhook failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 503 });
  }
}
