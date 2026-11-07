import type { Metadata } from "next";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Providers } from "./providers";
import { ConnectTimeAssistant } from "./components/connecttime-assistant";
import "./globals.css";
import "./auth.css";
import "./language.css";

export const metadata: Metadata = { title: "ConnectTime — Your All-in-One Media & Community Platform", description: "Connect with people, explore communities, discover news and video, watch official TV channels, and share what you love — all in one place.", applicationName: "ConnectTime", icons: { icon: "https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png", apple: "https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  const session = configured ? await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID! }).readSessionCookie() : null;
  return <html lang="en"><body><Providers session={session}>{children}<ConnectTimeAssistant /></Providers></body></html>;
}
