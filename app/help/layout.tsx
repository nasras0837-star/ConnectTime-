import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | ConnectTime",
  description: "Find answers about ConnectTime accounts, verification, community tools, Free TV, Radio, Video Tube, safety and privacy.",
  alternates: { canonical: "/help" },
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
