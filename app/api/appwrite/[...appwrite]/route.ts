import { createAppwriteHandlers } from "@appwrite.io/react/handlers/next";
const endpoint=process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT; const projectId=process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID; const apiKey=process.env.APPWRITE_API_KEY;
if(!endpoint||!projectId||!apiKey)throw new Error("Appwrite SSR environment variables are not configured.");
export const {GET,POST}=createAppwriteHandlers({endpoint,projectId,apiKey,basePath:"/api/appwrite"});
