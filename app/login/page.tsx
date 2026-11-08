"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";

type AuthStatus = { configured: boolean; missing: string[] };

export default function LoginPage() {
  const router = useRouter(); const { signIn, error } = useAuth(); const [message, setMessage] = useState("");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [statusUnavailable, setStatusUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Authentication status could not be checked.");
        return response.json() as Promise<AuthStatus>;
      })
      .then(status => { if (active) setAuthStatus(status); })
      .catch(() => { if (active) setStatusUnavailable(true); });
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget);
    try { await signIn.emailPassword({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), onSuccess: () => { router.push("/account"); router.refresh(); } }); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Login is not available yet."); }
  }
  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home"><img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1><LanguageText k="login" /></h1><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="password" /><input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={!authStatus?.configured || signIn.isPending || statusUnavailable}>{signIn.isPending ? "Signing in…" : "Log in"}</button><p className="switch"><Link href="/forgot-password">Forgot your password?</Link></p>{statusUnavailable ? <p role="alert" className="message">We could not check the sign-in service. Refresh this page and try again.</p> : authStatus && !authStatus.configured ? <p role="alert" className="message">Sign-in setup is incomplete. The site administrator must configure: {authStatus.missing.join(", ")}.</p> : (message || error) && <p role="alert" className="message">{message || error?.message}</p>}<p className="switch"><LanguageText k="newToConnectTime" /> <Link href="/register"><LanguageText k="createAccount" /></Link></p></form></main>;
}
