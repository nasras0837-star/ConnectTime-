"use client";
import { AppwriteProvider } from "@appwrite.io/react";
import { LanguageProvider } from "./components/language-provider";
import { LanguageSwitcher } from "./components/language-switcher";

function getValidEndpoint(value: string | undefined): string {
  if (!value) return "https://cloud.appwrite.io/v1";
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.pathname.replace(/\/$/, "").endsWith("/v1") && !url.username && !url.password) return value;
  } catch {
    // Use an inert fallback during preview builds; readiness remains false.
  }
  return "https://cloud.appwrite.io/v1";
}

export function Providers({ session, children }: { session?: string | null; children: React.ReactNode }) {
  // Never pass a misplaced private API key into the SDK's endpoint option.
  const endpoint = getValidEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "connect-preview-not-configured";
  return <LanguageProvider><AppwriteProvider endpoint={endpoint} projectId={projectId} ssr={{ session: session ?? null, basePath: "/api/appwrite" }}>{children}<LanguageSwitcher /></AppwriteProvider></LanguageProvider>;
}
