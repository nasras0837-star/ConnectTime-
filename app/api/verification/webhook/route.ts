import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Client, Databases, Query, TablesDB } from "node-appwrite";
import {
  resolveStoredVerificationStatus,
  resolveVerificationDecision,
} from "@/lib/verification-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Decision = { id?: string; vendorData?: string; status?: string; person?: { dateOfBirth?: string } };
type Payload = { verification?: Decision };

async function syncMemberAccess(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  userId: string,
  adultStatus: "verified" | "rejected" | "review",
  now: string,
) {
  let existing: Record<string, unknown> | null = null;
  try {
    existing = await databases.getDocument(databaseId, collectionId, userId);
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
  }

  if (!existing) {
    try {
      await databases.createDocument(databaseId, collectionId, userId, {
        adult_status: adultStatus,
        account_status: adultStatus === "verified" ? "active" : "pending",
        updated_at: now,
      });
      return;
    } catch (error) {
      // A concurrent webhook may have created the access record. Re-read it
      // and preserve its moderation/account state rather than overwriting it.
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 409)) throw error;
      existing = await databases.getDocument(databaseId, collectionId, userId);
    }
  }

  const accountStatus = typeof existing.account_status === "string"
    ? existing.account_status
    : adultStatus === "verified" ? "active" : "pending";
  await databases.updateDocument(databaseId, collectionId, userId, {
    adult_status: adultStatus,
    account_status: accountStatus,
    updated_at: now,
  });
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
  if (!endpoint || !projectId || !apiKey || !databaseId || !recordsTableId || !accessDatabaseId || !accessCollectionId) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tables = new TablesDB(client);
  const databases = new Databases(client);
  try {
    const found = await tables.listRows({
      databaseId,
      tableId: recordsTableId,
      queries: [
        Query.equal("provider_session_id", sessionId),
        Query.equal("user_id", userId),
        Query.equal("provider", "veriff"),
        Query.limit(2),
      ],
    });
    if (found.rows.length !== 1) return NextResponse.json({ error: "verification_session_not_found" }, { status: 404 });
    const record = found.rows[0];
    const recordStatus = String(record.status || "pending");
    const terminal = recordStatus === "verified" || recordStatus === "failed";

    // Terminal callbacks are idempotently reconciled against member access.
    // This repairs the old failure mode where the verification row was marked
    // complete before the access write succeeded and retries were discarded.
    const storedDecision = terminal ? resolveStoredVerificationStatus(recordStatus) : null;
    const resolved = storedDecision || resolveVerificationDecision(
      decision,
      typeof verification?.person?.dateOfBirth === "string" ? verification.person.dateOfBirth : null,
    );
    const now = new Date().toISOString();

    // Write access first. If this fails, leave the verification row pending so
    // Veriff can retry; if the later row update fails, the retry is safe.
    await syncMemberAccess(databases, accessDatabaseId, accessCollectionId, userId, resolved.adultStatus, now);

    if (!terminal) {
      await tables.updateRow({
        databaseId,
        tableId: recordsTableId,
        rowId: record.$id,
        data: {
          status: resolved.recordStatus,
          ...(resolved.recordStatus === "verified" ? { verified_at: now } : {}),
          updated_at: now,
        },
      });
    }

    return NextResponse.json(
      { received: true, ...(terminal ? { duplicate: true, accessReconciled: true } : {}) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Veriff decision webhook failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 503 });
  }
}
