import { NextResponse } from "next/server";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Client, Databases } from "node-appwrite";

import { getYotiSandboxSessionResult } from "@/lib/yoti-sandbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const collectionId = process.env.APPWRITE_YOTI_SESSIONS_COLLECTION_ID;

  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId ||
      process.env.YOTI_SANDBOX_ENABLED !== "true") {
    return NextResponse.json(
      { error: "verification_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { sessionId } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);
    const record = await databases.getDocument(databaseId, collectionId, sessionId);
    if (record.user_id !== user.$id || record.provider !== "yoti" || record.environment !== "sandbox") {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await getYotiSandboxSessionResult(sessionId);
    if (result.referenceId !== record.reference_id) {
      return NextResponse.json(
        { error: "verification_unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    await databases.updateDocument(databaseId, collectionId, sessionId, {
      status: result.status.toLowerCase(),
    });

    return NextResponse.json(
      {
        environment: "sandbox",
        status: result.status,
        sandboxPass: result.over18SandboxPass,
        productionVerification: false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "verification_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
