import { NextRequest, NextResponse } from "next/server";
import { createAppwriteHandlers } from "@appwrite.io/react/handlers/next";

function handlers() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!endpoint || !projectId || !apiKey) return null;
  return createAppwriteHandlers({ endpoint, projectId, apiKey, basePath: "/api/appwrite", cookieOptions: { secure: true, httpOnly: true, sameSite: "strict", path: "/" } });
}

async function unavailable() {
  return NextResponse.json({ error: "Appwrite is not configured for this deployment." }, { status: 503 });
}

export async function GET(request: NextRequest) {
  const configured = handlers();
  return configured ? configured.GET(request) : unavailable();
}

export async function POST(request: NextRequest) {
  const configured = handlers();
  return configured ? configured.POST(request) : unavailable();
}
