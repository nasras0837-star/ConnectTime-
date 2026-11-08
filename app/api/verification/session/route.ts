import { NextResponse } from "next/server";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Client, Databases } from "node-appwrite";

import { createYotiSandboxSession } from "@/lib/yoti-sandbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const collectionId = process.env.APPWRITE_YOTI_SESSIONS_COLLECTION_ID;

  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId ||
      process.env.YOTI_SANDBOX_ENABLED !== "true" ||
      !process.env.YOTI_SDK_ID || !process.env.YOTI_PRIVATE_KEY_PEM) {
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

    const session = await createYotiSandboxSession();
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);

    // Persist the user/session binding before returning the hosted URL.
    // This collection must be private and writable only by this server API key.
    await databases.createDocument(databaseId, collectionId, session.sessionId, {
      provider: "yoti",
      environment: "sandbox",
      user_id: user.$id,
      reference_id: session.referenceId,
      status: "pending",
      expires_at: session.expiresAt,
    });

    return NextResponse.json(
      {
        environment: "sandbox",
        sessionUrl: session.sessionUrl,
        sessionReference: session.sessionId,
        expiresAt: session.expiresAt,
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
