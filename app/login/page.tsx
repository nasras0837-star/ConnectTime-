"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAppwrite } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const { account } = useAppwrite();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<{totp?:boolean;email?:boolean;phone?:boolean}>({});
  const [challengeId, setChallengeId] = useState("");
  const [challengeOtp, setChallengeOtp] = useState("");
  const [challengeFactor, setChallengeFactor] = useState("");
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
    if (mfaRequired) {
      if (!challengeId) { setMessage("Choose a second verification method first."); return; }
      if (!challengeOtp.trim()) { setMessage("Enter your verification code."); return; }
      try {
        await account.updateMfaChallenge({ challengeId, otp: challengeOtp.trim() });
        router.push("/account"); router.refresh();
      } catch (err) { setMessage(err instanceof Error ? err.message : "The verification code was not accepted."); }
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await signIn.emailPassword({
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        onSuccess: () => { router.push("/account"); router.refresh(); },
      });
    } catch (err) {
      const authError = err as { type?: string; code?: string; message?: string };
      if (authError.type === "user_more_factors_required") {
        try {
          const factors = await account.listMfaFactors();
          setMfaFactors(factors);
          setMfaRequired(true);
          setMessage("Your password was accepted. Complete the second verification step to finish signing in.");
        } catch { setMessage("Additional verification is required, but your available factors could not be loaded. Try again."); }
      } else {
        setMessage(err instanceof Error ? err.message : "Sign-in is not available yet.");
      }
    }
  }

  async function beginMfaChallenge(factor: string) {
    setMessage(""); setChallengeOtp(""); setChallengeFactor(factor);
    try { const challenge = await account.createMfaChallenge({ factor: factor as never }); setChallengeId(challenge.$id); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not start the selected verification method."); }
  }

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1><LanguageText k="login" /></h1>{!mfaRequired ? <><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="password" /><input name="password" type="password" autoComplete="current-password" required/></label></> : <section className="mfaLogin"><h2>Verify it’s you</h2><p>Choose a second factor to finish signing in.</p><div className="mfaFactorButtons">{mfaFactors.totp && <button type="button" className="button" onClick={()=>beginMfaChallenge("totp")}>Authenticator app</button>}{mfaFactors.email && <button type="button" className="button" onClick={()=>beginMfaChallenge("email")}>Email code</button>}{mfaFactors.phone && <button type="button" className="button" onClick={()=>beginMfaChallenge("phone")}>SMS code</button>}<button type="button" className="button" onClick={()=>beginMfaChallenge("recoverycode")}>Recovery code</button></div>{challengeId && <><p>Verification method: {challengeFactor}</p><label>Verification code<input name="mfa-code" value={challengeOtp} onChange={e=>setChallengeOtp(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required/></label></>}</section>}<button className="button" disabled={authConfigured !== true || signIn.isPending || statusUnavailable || (mfaRequired && !challengeId)}>{signIn.isPending ? "Signing in…" : authConfigured === null ? "Checking sign-in service…" : mfaRequired ? "Verify and sign in" : "Log in"}</button>{statusUnavailable ? <p role="alert" className="message">We could not check the sign-in service. Refresh this page and try again.</p> : authConfigured === false ? <p role="status" className="message">Sign-in is temporarily unavailable because the site administrator has not completed the authentication service configuration.</p> : (message || error) && <p role="alert" className="message">{message || error?.message}</p>}<p className="switch"><LanguageText k="newToConnect" /> <Link href="/register"><LanguageText k="createAccount" /></Link></p></form></main>;
}
