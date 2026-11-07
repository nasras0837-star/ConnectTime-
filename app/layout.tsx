import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConnectTime — Your world, connected",
  description: "An international community for adults to connect, share, discover and create.",
  applicationName: "ConnectTime",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
