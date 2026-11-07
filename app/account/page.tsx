import Link from "next/link";
import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { checkMemberAccess } from "@/lib/member-access";
import { SignOutButton } from "./signout-button";

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) return <main className="authShell"><section className="authCard"><h1>ConnectTime setup required</h1><p>Appwrite environment settings have not been configured yet.</p><Link href="/">Return home</Link></section></main>;
  const user = await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID }).getLoggedInUser();
  if (!user) redirect("/login");
  const decision = await checkMemberAccess();
  const status = decision.allowed ? "Active · Verified adult" : decision.status === 403 ? "Pending · Not authorized" : decision.status === 503 ? "Unavailable · Configuration required" : "Signed in";
  return <main className="authShell"><Link className="logo" href="/"><span className="ctBrandMark" aria-label="CT">CT</span><span className="ctWordmark">Connect<span>Time</span></span></Link><section className="authCard"><div className="eyebrow">YOUR ACCOUNT</div><h1>{decision.allowed ? "Account active" : "Verification required"}</h1><p>Signed in as {user.email || user.name || "ConnectTime member"}.</p><p>{decision.allowed ? "Your server-side member record authorizes access. Individual features will still enforce their own connection, ownership, and safety rules." : "Social and creator features remain locked until independent adult verification and server-side activation are complete."}</p><p className="message">Account access: {status}</p><p><Link href="/profile">Edit your profile →</Link></p>{decision.allowed && <><p><Link href="/discover">Discover members →</Link></p><p><Link href="/friends">Friends & requests →</Link></p><p><Link href="/notifications">Notifications →</Link></p></>}<p><Link href="/safety">Safety Center →</Link></p><SignOutButton /></section></main>;
}
