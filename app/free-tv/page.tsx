import Link from "next/link";
import { currentCommunityMember } from "@/lib/community-safety";
import { checkMemberAccess } from "@/lib/member-access";
import FreeTvDirectory from "./free-tv-directory";

export const dynamic = "force-dynamic";

export default async function FreeTvPage() {
  const user = await currentCommunityMember();
  if (!user) return <main className="freeTvGate"><section><div className="freeTvEyebrow">CONNECT · CONNECT VIDEO TUBE</div><h1>Connect Video Tube</h1><p>Watch and discover official video and TV channels from around the world. Sign in to open your personalized channel guide.</p><div className="freeTvGateActions"><Link href="/register">Register Now</Link><Link href="/login?next=%2Ffree-tv">Already registered? Sign in</Link></div><small>Connect Video Tube is available to signed-in, verified adult members. Broadcaster and regional restrictions still apply.</small></section></main>;

  const access = await checkMemberAccess();
  if (!access.allowed) return <main className="freeTvGate"><section><div className="freeTvEyebrow">MEMBER ACCESS</div><h1>Verify your account to use Connect Video Tube</h1><p>You are signed in, but Connect must confirm your adult eligibility and active member status before opening member features.</p><div className="freeTvGateActions"><Link href="/account">Go to account</Link><Link href="/safety">Safety & verification information</Link></div><small>{access.reason === "not_configured" || access.reason === "access_unavailable" ? "Member verification is temporarily unavailable. Please try again later." : "Connect Video Tube is available to active, verified adult members."}</small></section></main>;

  return <FreeTvDirectory />;
}
