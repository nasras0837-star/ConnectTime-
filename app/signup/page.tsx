"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, error } = useAuth();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    if (form.get("adult") !== "on") { setMessage("You must confirm that you are 18 or older."); return; }
    try { await signUp.emailPassword({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), name: String(form.get("name") || "").trim(), onSuccess: () => { router.push("/account"); router.refresh(); } }); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Signup is not available yet."); }
  }
  return <main className="authShell"><Link className="logo" href="/">Connect<span>Time</span></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">JOIN THE COMMUNITY</div><h1>Create your account</h1><p>ConnectTime is for adults aged 18 and over.</p><label>Display name<input name="name" autoComplete="name" maxLength={80} required/></label><label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" minLength={12} autoComplete="new-password" required/></label><label className="consent"><input name="adult" type="checkbox" required/> I confirm that I am at least 18 years old.</label><button className="button" disabled={signUp.isPending}>{signUp.isPending ? "Creating account…" : "Create account"}</button>{(message || error) && <p role="status" className="message">{message || error?.message}</p>}<small>Age confirmation is not identity verification. Full platform access remains locked until a trusted verification provider independently confirms adult eligibility.</small><p className="switch">Already registered? <Link href="/login">Log in</Link></p></form></main>;
}
