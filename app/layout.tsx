import type { Metadata } from "next";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Providers } from "./providers";
import { ConnectAssistant } from "./components/connect-assistant";
import { MobileQuickNavigation } from "./components/mobile-quick-navigation";
import "./globals.css";
import "./mobile-navigation.css";
import "./auth.css";
import "./language.css";
import "./behance-theme.css";
import "../docs/connect-design-system.css";
import "./readability-overrides.css";

export const metadata: Metadata = { title: "Connect — Your All-in-One Media & Community Platform", description: "Connect with people, explore communities, discover news and video, watch official TV channels, and share what you love — all in one place.", applicationName: "Connect", openGraph: { title: "Connect — Your All-in-One Media & Community Platform", description: "Connect with people, explore communities, discover news and video, and watch official TV channels — all in one place.", siteName: "Connect", type: "website" }, twitter: { card: "summary_large_image", title: "Connect — Your All-in-One Media & Community Platform", description: "Your people. Your passions. Your Connect." }, icons: { icon: "/connect-logo.svg", apple: "/connect-logo.svg" } };

function isValidAppwriteEndpoint(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.replace(/\/$/, "").endsWith("/v1") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const configured = Boolean(projectId && isValidAppwriteEndpoint(endpoint));

  // An expired or malformed session cookie must never prevent public routes
  // (including /login and /register) from rendering. Treat it as signed out.
  let session: string | null = null;
  if (configured) {
    try {
      session = (await createNextServerHelpers({ endpoint: endpoint!, projectId: projectId! }).readSessionCookie()) ?? null;
    } catch {
      session = null;
    }
  }

  return <html lang="en"><body className="connectAppTheme"><Providers session={session}>{children}<ConnectAssistant /><MobileQuickNavigation /></Providers></body></html>;
}
