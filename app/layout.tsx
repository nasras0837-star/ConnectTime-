import type { Metadata } from "next";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Providers } from "./providers";
import { ConnectAssistant } from "./components/connect-assistant";
import "./globals.css";
import "./auth.css";
import "./language.css";

export const metadata: Metadata = { title: "Connect — Your All-in-One Media & Community Platform", description: "Connect with people, explore communities, discover news and video, watch official TV channels, and share what you love — all in one place.", applicationName: "Connect", openGraph: { title: "Connect — Your All-in-One Media & Community Platform", description: "Connect with people, explore communities, discover news and video, and watch official TV channels — all in one place.", siteName: "Connect", type: "website" }, twitter: { card: "summary_large_image", title: "Connect — Your All-in-One Media & Community Platform", description: "Your people. Your passions. Your Connect." }, icons: { icon: "https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/public/connecttime-logo.svg", apple: "https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/public/connecttime-logo.svg" } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  const session = configured ? await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID! }).readSessionCookie() : null;
  return <html lang="en"><body><Providers session={session}>{children}<ConnectAssistant /></Providers></body></html>;
}
