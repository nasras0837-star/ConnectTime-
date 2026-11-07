"use client";
import { AppwriteProvider } from "@appwrite.io/react";

export function Providers({ session, children }: { session?: string | null; children: React.ReactNode }) {
  // Keep the provider mounted during static prerendering so useAuth() always has context.
  // Preview credentials are inert; real authentication requires Vercel environment variables.
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "connecttime-preview-not-configured";
  return <AppwriteProvider endpoint={endpoint} projectId={projectId} ssr={{ session: session ?? null, basePath: "/api/appwrite" }}>{children}</AppwriteProvider>;
}
