import { Client, ID, Query, TablesDB } from "node-appwrite";
import { timingSafeEqual } from "node:crypto";

export function advertisingStore() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    throw new Error("Appwrite advertising storage is not configured.");
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { tablesDB: new TablesDB(client), databaseId };
}

export function requireReviewAdmin(request: Request) {
  const expected = process.env.AD_REVIEW_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "") || "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export { ID, Query };
