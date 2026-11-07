"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const featureNames: Record<string, string> = {
  friends: "Friends",
  requests: "Friend requests",
  messages: "Messages",
  "video-chat": "Video chat",
  dating: "Match Maker & Dating",
  marketplace: "Marketplace",
  forums: "Forums",
  blogs: "Blogs",
  live: "Live experiences",
};

export default function ComingSoonPage() {
  const params = useParams<{ feature: string }>();
  const slug = String(params.feature || "").toLowerCase();
  const feature = featureNames[slug] || "This ConnectTime feature";

  return (
    <main className="authShell">
      <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home">
        <img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage" />
      </Link>
      <section className="authCard" aria-labelledby="coming-soon-title">
        <div className="eyebrow">CONNECTTIME · BUILDING IN STAGES</div>
        <h1 id="coming-soon-title">{feature}</h1>
        <p>This experience is on the ConnectTime roadmap and is still being built. It is not open for member use yet.</p>
        <p className="message" role="status">Preview only · No account action, payment, or publication is being processed here.</p>
        <div className="introActions">
          <Link href="/news">Explore community news</Link>
          <Link className="introExplore" href="/register">Create a free profile</Link>
        </div>
        <p className="switch"><Link href="/">← Back to ConnectTime home</Link></p>
      </section>
    </main>
  );
}
