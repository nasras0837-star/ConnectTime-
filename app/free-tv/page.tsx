import Link from "next/link";
import { currentCommunityMember } from "@/lib/community-safety";
import { checkMemberAccess } from "@/lib/member-access";
import FreeTvDirectory from "./free-tv-directory";

export const dynamic = "force-dynamic";

export default async function FreeTvPage() {
  const user = await currentCommunityMember();
  if (!user) return <main className="freeTvGate"><section><div className="freeTvEyebrow">CONNECTTIME · FREE TV</div><h1>Free TV from around the world</h1><p>Explore official local news and entertainment broadcasters from participating regions. Create a ConnectTime account to use the channel guide.</p><div className="freeTvGateActions"><Link href="/register">Register Now</Link><Link href="/login">Already registered? Sign in</Link></div><small>ConnectTime membership is for adults 18+. Broadcaster availability and regional restrictions still apply.</small></section></main>;

  const access = await checkMemberAccess();
  if (!access.allowed) return <main className="freeTvGate"><section><div className="freeTvEyebrow">MEMBER ACCESS</div><h1>Complete account verification to continue</h1><p>You are signed in, but ConnectTime must confirm your adult eligibility and active member status before opening member features.</p><div className="freeTvGateActions"><Link href="/account">Go to account</Link><Link href="/safety">Safety & verification information</Link></div><small>{access.reason === "not_configured" || access.reason === "access_unavailable" ? "Member verification is temporarily unavailable. Please try again later." : "This feature is available to active, verified adult members."}</small></section></main>;

  return <FreeTvDirectory />;
}
