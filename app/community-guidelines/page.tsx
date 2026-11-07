import Link from "next/link";

const sections = [
  { title: "A place for open expression", body: "ConnectTime supports freedom of expression and lively, good-faith discussion. Members may share opinions, criticism, personal experiences, humor, art, political and social viewpoints, and unpopular ideas, provided their expression follows the law and these Community Guidelines. Disagreement, criticism, satire, or a viewpoint someone dislikes is not harassment by itself." },
  { title: "Harassment and intimidation are not allowed", body: "Do not target, threaten, bully, intimidate, stalk, or repeatedly contact someone who has asked you to stop. Do not encourage others to pile on, threaten violence, expose private information, blackmail, or use sexualized abuse to frighten or silence someone. Do not make credible threats or celebrate, encourage, or coordinate real-world harm." },
  { title: "Debate the idea, respect the person", body: "Challenge claims, arguments, public actions, and ideas without targeting a person with abuse. Do not use slurs or dehumanizing attacks to target people based on protected or personal characteristics. Do not impersonate someone to deceive or humiliate them." },
  { title: "Privacy, consent, and safety", body: "Do not publish another person's private contact details, home address, financial or identity information, private messages, or intimate imagery without permission. Do not share non-consensual intimate content, sexual exploitation, or any sexual content involving minors. ConnectTime is an adults-only 18+ community." },
  { title: "How moderation should work", body: "Reports should be reviewed in context, distinguishing disagreement and criticism from targeted abuse. Depending on severity and repetition, responses may include no action, content removal, a warning, temporary restrictions, or account suspension. Credible threats, doxxing, stalking, or severe abuse may require immediate action. Members should be told the reason for significant enforcement and have a way to appeal where appropriate." },
  { title: "How to disagree constructively", body: "Be specific about the idea you disagree with. Avoid repeated unwanted replies or direct messages. Respect a request to stop contact. If a discussion becomes personal or threatening, disengage and use available safety tools." },
];

export default function CommunityGuidelinesPage() {
  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home"><img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage" /></Link>
    <article className="authCard" style={{ maxWidth: 820 }}>
      <div className="eyebrow">CONNECTTIME · COMMUNITY STANDARDS</div>
      <h1>Speak freely. Treat people with respect.</h1>
      <p>ConnectTime is built for open conversation across backgrounds and viewpoints. We do not remove content simply because it is controversial, unpopular, critical, or disagrees with someone else&apos;s opinion. The boundary is harassment, intimidation, threats, privacy violations, and other harmful conduct.</p>
      {sections.map(section => <section key={section.title} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, letterSpacing: "-.4px", marginBottom: 8 }}>{section.title}</h2>
        <p style={{ lineHeight: 1.7 }}>{section.body}</p>
      </section>)}
      <p className="message" role="note">The Safety Center now provides report, block, and appeal forms. These tools require Appwrite safety tables to be configured; moderator review, enforcement integrations, and end-to-end testing remain required before full community launch.</p>
      <p className="switch"><Link href="/">← Back to ConnectTime</Link> · <Link href="/safety">Open Safety Center</Link> · <Link href="/signup">Create a profile</Link></p>
    </article>
  </main>;
}
