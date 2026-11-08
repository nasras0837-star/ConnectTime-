import { NextResponse } from "next/server";
import { Client, ID, Query, TablesDB } from "node-appwrite";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configuration() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const recordsTableId = process.env.APPWRITE_VERIFICATION_RECORDS_TABLE_ID;
  const baseUrl = process.env.VERIFF_BASE_URL;
  const apiKeyVeriff = process.env.VERIFF_API_KEY;
  const sharedSecret = process.env.VERIFF_SHARED_SECRET;
  const callbackUrl = process.env.VERIFF_CALLBACK_URL;
  if (!endpoint || !projectId || !apiKey || !databaseId || !recordsTableId || !baseUrl || !apiKeyVeriff || !sharedSecret || !callbackUrl) return null;
  let base: URL; let callback: URL;
  try { base = new URL(baseUrl); callback = new URL(callbackUrl); } catch { return null; }
  if (base.protocol !== "https:" || callback.protocol !== "https:" || !callback.pathname.endsWith("/api/verification/webhook")) return null;
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { tables: new TablesDB(client), databaseId, recordsTableId, baseUrl: base.toString().replace(/\/$/, ""), veriffApiKey: apiKeyVeriff, callbackUrl: callback.toString() };
}

export async function POST() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return NextResponse.json({ error: "verification_unavailable" }, { status: 503 });
  const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const config = configuration();
  if (!config) return NextResponse.json({ error: "verification_provider_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });

  try {
    const active = await config.tables.listRows({ databaseId: config.databaseId, tableId: config.recordsTableId, queries: [Query.equal("user_id", user.$id), Query.equal("status", "pending"), Query.limit(5)] });
    if (active.rows.length) {
      const existing = active.rows[0];
      return NextResponse.json({ status: "pending", verificationUrl: String(existing.verification_url || "") }, { headers: { "Cache-Control": "no-store" } });
    }
    const response = await fetch(config.baseUrl + "/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AUTH-CLIENT": config.veriffApiKey },
      body: JSON.stringify({ verification: { callback: config.callbackUrl, vendorData: user.$id, endUserId: user.$id } }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Veriff session creation failed");
    const payload = await response.json();
    const verification = payload?.verification;
    const sessionId = typeof verification?.id === "string" ? verification.id : "";
    const verificationUrl = typeof verification?.url === "string" ? verification.url : "";
    if (!sessionId || !verificationUrl || !/^https:\/\//i.test(verificationUrl)) throw new Error("Veriff returned an invalid session");
    await config.tables.createRow({
      databaseId: config.databaseId, tableId: config.recordsTableId, rowId: ID.unique(),
      data: { user_id: user.$id, provider: "veriff", provider_session_id: sessionId, verification_url: verificationUrl, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    });
    return NextResponse.json({ status: "pending", verificationUrl }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Veriff session creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "verification_session_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
