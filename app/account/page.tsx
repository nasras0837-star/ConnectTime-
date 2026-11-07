import Link from "next/link";
import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { SignOutButton } from "./signout-button";

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) return <main className="authShell"><section className="authCard"><h1>ConnectTime setup required</h1><p>Appwrite environment settings have not been configured yet.</p><Link href="/">Return home</Link></section></main>;
  const user = await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID }).getLoggedInUser();
  if (!user) redirect("/login");
  return <main className="authShell"><Link className="logo" href="/">Connect<span>Time</span></Link><section className="authCard"><div className="eyebrow">YOUR ACCOUNT</div><h1>Verification required</h1><p>Signed in as {user.email || user.name || "ConnectTime member"}.</p><p>Your account is not authorized to use social features yet. Access remains locked until an approved provider confirms adult eligibility and a server-side review activates the account.</p><p className="message">Account access: pending · Adult eligibility: pending</p><SignOutButton /></section></main>;
}
