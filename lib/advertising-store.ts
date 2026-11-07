import { Client, Databases, ID, Query } from "node-appwrite";

export function advertisingStore() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    throw new Error("Appwrite advertising storage is not configured.");
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { databases: new Databases(client), databaseId };
}

export function requireReviewAdmin(request: Request) {
  const expected = process.env.AD_REVIEW_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && supplied && supplied.length === expected.length &&
    // Constant-time comparison without relying on request-controlled lengths.
    Buffer.from(supplied).equals(Buffer.from(expected)));
}

export { ID, Query };
