import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("adult_status,account_status").eq("id", user.id).maybeSingle();
  const verified = profile?.adult_status === "verified" && profile?.account_status === "active";
  return <main className="authShell"><Link className="logo" href="/">Connect<span>Time</span></Link><section className="authCard"><div className="eyebrow">YOUR ACCOUNT</div><h1>{verified ? "Welcome to ConnectTime" : "Verification required"}</h1><p>{verified ? "Your account has passed adult eligibility checks." : "Your sign-in is active, but the social platform remains locked until adult eligibility is verified by an approved verification provider."}</p><p className="message">Account status: {profile?.account_status ?? "pending"} · Adult eligibility: {profile?.adult_status ?? "pending"}</p><form action="/auth/signout" method="post"><button className="button">Sign out</button></form></section></main>;
}
