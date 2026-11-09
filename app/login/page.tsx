"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAppwrite } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";
import { AuthenticationFactor } from "appwrite";

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
  const [missingConfig, setMissingConfig] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Authentication status could not be checked.");
        return response.json() as Promise<{ configured: boolean; missing?: string[] }>;
      })
      .then(status => { if (active) { setAuthConfigured(status.configured); setMissingConfig(status.missing || []); } })
      .catch(() => { if (active) setStatusUnavailable(true); });
    return () => { active = false; };
  }, []);

  function getReturnPath() {
    const requested = new URLSearchParams(window.location.search).get("next") || "";
    return requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/login") ? requested : "/account";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mfaRequired) {
      if (!challengeId) { setMessage("Choose a second verification method first."); return; }
      if (!challengeOtp.trim()) { setMessage("Enter your verification code."); return; }
      try {
        await account.updateMfaChallenge({ challengeId, otp: challengeOtp.trim() });
        router.push(getReturnPath()); router.refresh();
      } catch (err) { setMessage(friendlyAuthMessage(err, "The verification code was not accepted.")); }
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await signIn.emailPassword({
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || ""),
        onSuccess: () => { router.push(getReturnPath()); router.refresh(); },
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
        setMessage(friendlyAuthMessage(err, "Sign-in is not available yet."));
      }
    }
  }

  async function beginMfaChallenge(factor: AuthenticationFactor) {
    setMessage(""); setChallengeOtp(""); setChallengeFactor(factor);
    try { const challenge = await account.createMfaChallenge({ factor }); setChallengeId(challenge.$id); }
    catch (err) { setMessage(friendlyAuthMessage(err, "Could not start the selected verification method.")); }
  }

  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1><LanguageText k="login" /></h1>{!mfaRequired ? <><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="password" /><input name="password" type="password" autoComplete="current-password" required/></label></> : <section className="mfaLogin"><h2>Verify it’s you</h2><p>Choose a second factor to finish signing in.</p><div className="mfaFactorButtons">{mfaFactors.totp && <button type="button" className="button" onClick={()=>beginMfaChallenge(AuthenticationFactor.Totp)}>Authenticator app</button>}{mfaFactors.email && <button type="button" className="button" onClick={()=>beginMfaChallenge(AuthenticationFactor.Email)}>Email code</button>}{mfaFactors.phone && <button type="button" className="button" onClick={()=>beginMfaChallenge(AuthenticationFactor.Phone)}>SMS code</button>}<button type="button" className="button" onClick={()=>beginMfaChallenge(AuthenticationFactor.Recoverycode)}>Recovery code</button></div>{challengeId && <><p>Verification method: {challengeFactor}</p><label>Verification code<input name="mfa-code" value={challengeOtp} onChange={e=>setChallengeOtp(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required/></label></>}</section>}<button className="button" disabled={signIn.isPending || (mfaRequired && !challengeId)}>{signIn.isPending ? "Signing in…" : authConfigured === null ? "Checking sign-in service…" : mfaRequired ? "Verify and sign in" : "Log in"}</button>{statusUnavailable ? <p role="status" className="message">We could not run the service pre-check. You can still try signing in; if it fails, try again shortly.</p> : authConfigured === false ? <p role="status" className="message">The service pre-check found missing server settings{missingConfig.length ? `: ${missingConfig.join(", ")}` : ""}. You can still try signing in; contact the pilot administrator if the request fails.</p> : null}{(message || error) && <p role="alert" className="message">{message || friendlyAuthMessage(error, "Sign-in failed. Please try again.")}</p>}<p className="switch"><LanguageText k="newToConnect" /> <Link href="/register"><LanguageText k="createAccount" /></Link></p></form></main>;
}
