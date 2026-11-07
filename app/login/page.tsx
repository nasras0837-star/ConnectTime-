"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";

export default function LoginPage() {
  const router = useRouter(); const { signIn, error } = useAuth(); const [message, setMessage] = useState("");
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget);
    try { await signIn.emailPassword({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), onSuccess: () => { router.push("/account"); router.refresh(); } }); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Login is not available yet."); }
  }
  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home"><img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1><LanguageText k="login" /></h1><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="password" /><input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={!authConfigured || signIn.isPending}>{signIn.isPending ? "Signing in…" : "Log in"}</button>{!authConfigured ? <p role="status" className="message">Sign-in is not configured in this preview yet.</p> : (message || error) && <p role="status" className="message">{message || error?.message}</p>}<p className="switch"><LanguageText k="newToConnectTime" /> <Link href="/signup"><LanguageText k="createAccount" /></Link></p></form></main>;
}
