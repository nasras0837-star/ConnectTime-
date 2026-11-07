import Link from "next/link";
import { notFound } from "next/navigation";

type FeaturePage = {
  title: string;
  eyebrow: string;
  intro: string;
  description: string;
  icon: string;
  highlights: string[];
  planned: string[];
  related: { label: string; href: string }[];
};

const pages: Record<string, FeaturePage> = {
  friends: {
    title: "Friends",
    eyebrow: "CONNECT · BUILD YOUR CIRCLE",
    intro: "Meet people who share your interests, values, and curiosity.",
    description: "The planned Friends experience will help members discover people, send connection requests, and build a trusted community across borders.",
    icon: "🤝",
    highlights: ["Discover people by shared interests", "View member profiles and mutual connections", "Choose who can send you connection requests"],
    planned: ["Friend suggestions and search filters", "Accept, decline, and manage requests", "Privacy controls, blocking, and reporting"],
    related: [{label:"Chat rooms",href:"/chat-rooms"},{label:"Community news",href:"/news"}]
  },
  requests: {
    title: "Friend requests",
    eyebrow: "CONNECT · YOUR CONNECTIONS",
    intro: "Manage invitations and decide who joins your circle.",
    description: "A dedicated place to review incoming and outgoing friend requests, with clear controls over unwanted contact.",
    icon: "✉️",
    highlights: ["Review incoming invitations", "Track requests you have sent", "Accept, ignore, or remove a request"],
    planned: ["Request inbox and activity notifications", "Connection suggestions", "Block and report tools linked to Safety Center"],
    related: [{label:"Safety Center",href:"/safety"},{label:"Community Guidelines",href:"/community-guidelines"}]
  },
  messages: {
    title: "Messages",
    eyebrow: "CONNECT · PRIVATE CONVERSATIONS",
    intro: "Keep the conversation going with people you choose.",
    description: "ConnectTime plans private messaging for accepted connections, with controls to protect your inbox and manage unwanted contact.",
    icon: "💬",
    highlights: ["One-to-one conversations", "Conversation requests and inbox controls", "Block and report access from conversations"],
    planned: ["Text messaging and delivery states", "Message request filtering", "Notifications, privacy settings, and abuse reporting"],
    related: [{label:"Chat rooms",href:"/chat-rooms"},{label:"Safety Center",href:"/safety"}]
  },
  "video-chat": {
    title: "Voice & video chat",
    eyebrow: "CONNECT · REAL-TIME CONVERSATIONS",
    intro: "Make a connection feel more personal.",
    description: "Voice and video calling are planned for eligible members and accepted connections. Calls are not enabled in this preview.",
    icon: "📹",
    highlights: ["Permission-based microphone and camera access", "Call controls and the ability to end a call", "Safety tools for unwanted or abusive calls"],
    planned: ["One-to-one voice and video sessions", "Connection and privacy eligibility checks", "Abuse reporting and call access controls"],
    related: [{label:"Messages",href:"/coming-soon/messages"},{label:"Safety Center",href:"/safety"}]
  },
  dating: {
    title: "Match Maker & Dating",
    eyebrow: "CONNECT · MEANINGFUL CONNECTIONS",
    intro: "Discover people who are looking for the same kind of connection.",
    description: "The planned adults-only Match Maker experience will support discovery based on preferences and shared interests. It is not currently open for matching.",
    icon: "💖",
    highlights: ["Relationship goals and shared interests", "Member-controlled discovery preferences", "Respectful ways to start a conversation"],
    planned: ["Dating profiles and preference settings", "Matching and discovery controls", "Age and identity verification before access"],
    related: [{label:"Community Guidelines",href:"/community-guidelines"},{label:"Safety Center",href:"/safety"}]
  },
  marketplace: {
    title: "Marketplace",
    eyebrow: "DISCOVER · BUY, SELL & SUPPORT",
    intro: "Find independent sellers, useful products, and local discoveries.",
    description: "ConnectTime Marketplace is planned as a discovery space for listings and sellers. Transactions will not be processed in this preview.",
    icon: "🛍️",
    highlights: ["Browse listings by category and location", "Discover independent sellers", "Seller profiles and listing details"],
    planned: ["Listing creation and moderation", "Buyer-seller messaging", "Payment, refund, dispute, and prohibited-item safeguards"],
    related: [{label:"Events",href:"/events"},{label:"Advertising",href:"/advertise"}]
  },
  forums: {
    title: "Forums & discussions",
    eyebrow: "CREATE · SHARE YOUR PERSPECTIVE",
    intro: "Ask questions, exchange ideas, and take part in thoughtful discussions.",
    description: "Forums are planned for topic-based public conversations. ConnectTime supports freedom of expression while prohibiting harassment, intimidation, threats, and privacy violations.",
    icon: "🗣️",
    highlights: ["Interest-based discussion spaces", "Topics, replies, and community perspectives", "Room for respectful disagreement and debate"],
    planned: ["Forum categories and topic creation", "Replies, reactions, and subscriptions", "Moderation, reporting, and appeal workflows"],
    related: [{label:"Chat rooms",href:"/chat-rooms"},{label:"Community Guidelines",href:"/community-guidelines"}]
  },
  blogs: {
    title: "Blogs & creator channels",
    eyebrow: "CREATE · PUBLISH YOUR STORY",
    intro: "Share longer stories and build an audience around what you create.",
    description: "The planned publishing tools will let members create articles and creator pages. Public publishing and media uploads remain subject to safety and moderation readiness.",
    icon: "✍️",
    highlights: ["Long-form articles and personal stories", "Creator profiles and topic collections", "Audience discovery and sharing controls"],
    planned: ["Drafts and publishing workflow", "Creator channels and follower tools", "Content reporting, copyright handling, and moderation"],
    related: [{label:"News & stories",href:"/news"},{label:"Create a post",href:"/create"}]
  },
  live: {
    title: "ConnectTime Live",
    eyebrow: "WATCH · SHARE MOMENTS LIVE",
    intro: "Bring people together around real-time experiences.",
    description: "Live broadcasting is on the roadmap. Streaming, audience interaction, and monetization are not enabled in this preview.",
    icon: "🔴",
    highlights: ["Live creator broadcasts", "Audience participation and chat controls", "Discovery by topic and interest"],
    planned: ["Creator eligibility and stream setup", "Live chat moderation and reporting", "Copyright, safety, and broadcast interruption controls"],
    related: [{label:"Video Tube",href:"/videos"},{label:"Safety Center",href:"/safety"}]
  }
};

export default async function PlannedFeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const page = pages[feature.toLowerCase()];
  if (!page) notFound();

  return (
    <main className="authShell plannedFeatureShell">
      <header className="plannedFeatureHeader">
        <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home">
          <img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage" />
        </Link>
        <nav><Link href="/">Home</Link><Link href="/news">Explore</Link><Link href="/register" className="eventsJoin">Register Now ↗</Link></nav>
      </header>
      <section className="authCard plannedFeatureCard" aria-labelledby="planned-feature-title">
        <div className="plannedFeatureIcon" aria-hidden="true">{page.icon}</div>
        <div className="eyebrow">{page.eyebrow}</div>
        <h1 id="planned-feature-title">{page.title}</h1>
        <h2>{page.intro}</h2>
        <p>{page.description}</p>
        <div className="plannedFeatureStatus" role="status"><strong>Planned feature · Not yet available</strong><span>This page explains the planned experience. It does not create accounts, publish content, send messages, or process payments.</span></div>
        <div className="plannedFeatureColumns">
          <section><h3>What this feature is designed to offer</h3><ul>{page.highlights.map(item=><li key={item}>{item}</li>)}</ul></section>
          <section><h3>Planned functionality</h3><ul>{page.planned.map(item=><li key={item}>{item}</li>)}</ul></section>
        </div>
        <div className="plannedFeatureRelated"><h3>Explore ConnectTime</h3><div>{page.related.map(item=><Link key={item.href} href={item.href}>{item.label} ↗</Link>)}</div></div>
        <div className="introActions"><Link href="/register">Register Now</Link><Link className="introExplore" href="/">Back to homepage</Link></div>
        <p className="switch">Adults 18+ · <Link href="/community-guidelines">Community Guidelines</Link> · <Link href="/safety">Safety Center</Link></p>
      </section>
      <footer className="plannedFeatureFooter">© {new Date().getFullYear()} ConnectTime · Your people. Your passions. Your ConnectTime.</footer>
    </main>
  );
}
