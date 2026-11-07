import type { Metadata } from "next";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Providers } from "./providers";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = { title: "ConnectTime — Your world, connected", description: "An international community for adults to connect, share, discover and create.", applicationName: "ConnectTime", icons: { icon: "/connecttime-logo.svg", apple: "/connecttime-logo.svg" } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  const session = configured ? await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID! }).readSessionCookie() : null;
  return <html lang="en"><body><Providers session={session}>{children}</Providers></body></html>;
}
