"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [message, setMessage] = useState("");
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [statusUnavailable, setStatusUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Authentication status could not be checked.");
        return response.json() as Promise<{ configured: boolean }>;
      })
      .then(status => { if (active) setAuthConfigured(status.configured); })
      .catch(() => { if (active) setStatusUnavailable(true); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await signIn.emailPassword({
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        onSuccess: () => { router.push("/account"); router.refresh(); },
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in is not available yet.");
    }
  }

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1><LanguageText k="login" /></h1><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="password" /><input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={authConfigured !== true || signIn.isPending || statusUnavailable}>{signIn.isPending ? "Signing in…" : authConfigured === null ? "Checking sign-in service…" : "Log in"}</button>{statusUnavailable ? <p role="alert" className="message">We could not check the sign-in service. Refresh this page and try again.</p> : authConfigured === false ? <p role="status" className="message">Sign-in is temporarily unavailable because the site administrator has not completed the authentication service configuration.</p> : (message || error) && <p role="alert" className="message">{message || error?.message}</p>}<p className="switch"><LanguageText k="newToConnect" /> <Link href="/register"><LanguageText k="createAccount" /></Link></p></form></main>;
}
