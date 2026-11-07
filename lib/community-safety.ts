import "server-only";
import { Client, TablesDB } from "node-appwrite";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";

export async function currentCommunityMember() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return null;
  try {
    return await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
  } catch {
    return null;
  }
}

export function communitySafetyStore() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId) throw new Error("Community safety storage is not configured.");
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { tablesDB: new TablesDB(client), databaseId };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
