"use client";

import { useEffect, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

type MfaFactors = { totp?: boolean; email?: boolean; phone?: boolean };

export default function MfaPanel() {
  const { account } = useAppwrite();
  const [emailVerified, setEmailVerified] = useState(false);
  const [totpVerified, setTotpVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [status, setStatus] = useState("Checking your security settings…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshFactors() {
    const user = await account.get();
    const factors = await account.listMfaFactors() as MfaFactors;
    const verifiedEmail = Boolean(user.emailVerification);
    const enabled = Boolean(user.mfa);
    setEmailVerified(verifiedEmail);
    setTotpVerified(Boolean(factors.totp));
    setPhoneVerified(Boolean(factors.phone));
    setMfaEnabled(enabled);
    return { emailVerified: verifiedEmail, factors, mfaEnabled: enabled };
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("userId");
        const verificationSecret = params.get("secret");
        if (userId && verificationSecret) {
          await account.updateVerification({ userId, secret: verificationSecret });
          window.history.replaceState({}, "", window.location.pathname);
        }
        await refreshFactors();
        if (active) setStatus("Review your available sign-in factors below.");
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Security settings could not be loaded.");
      }
    })();
    return () => { active = false; };
  }, [account]);

  async function sendEmailVerification() {
    setBusy(true); setError(""); setStatus("");
    try {
      await account.createVerification({ url: window.location.origin + "/account/settings" });
      setStatus("Verification email sent. Open the link in that email, then return to this page.");
    } catch (e) { setError(e instanceof Error ? e.message : "Verification email could not be sent."); }
    finally { setBusy(false); }
  }

  async function startAuthenticator() {
    setBusy(true); setError(""); setStatus("");
    try {
      const result = await account.createMfaAuthenticator({ type: "totp" });
      setSecret(result.secret);
      setStatus("Add this account to your authenticator app, then enter its six-digit code.");
    } catch (e) { setError(e instanceof Error ? e.message : "Authenticator setup could not be started."); }
    finally { setBusy(false); }
  }

  async function verifyAuthenticator() {
    if (!/^\d{6}$/.test(otp.trim())) { setError("Enter the six-digit code from your authenticator app."); return; }
    setBusy(true); setError(""); setStatus("");
    try {
      await account.updateMfaAuthenticator({ type: "totp", otp: otp.trim() });
      setSecret(""); setOtp("");
      await refreshFactors();
      setStatus("Authenticator verified. Complete email verification as well, then enable MFA.");
    } catch (e) { setError(e instanceof Error ? e.message : "The authenticator code was not accepted."); }
    finally { setBusy(false); }
  }

  async function enableMfa() {
    setBusy(true); setError(""); setStatus("");
    try {
      const current = await refreshFactors();
      const factors = current.factors;
      if (!factors.totp || (!current.emailVerified && !factors.email && !factors.phone)) {
        throw new Error("MFA requires a verified authenticator app plus a second verified factor, such as email or phone.");
      }
      const result = await account.createMfaRecoveryCodes();
      setRecoveryCodes(result.recoveryCodes || []);
      await account.updateMFA({ mfa: true });
      setMfaEnabled(true);
      setStatus("Multi-factor authentication is enabled. Save your recovery codes somewhere private.");
    } catch (e) { setError(e instanceof Error ? e.message : "MFA could not be enabled."); }
    finally { setBusy(false); }
  }

  return <section className="settingsSection" aria-labelledby="connect-mfa-title">
    <h2 id="connect-mfa-title">Sign-in security · Multi-factor authentication</h2>
    <p>Add a second verification step to protect your Connect account. Authenticator apps such as Google Authenticator, Microsoft Authenticator, or 1Password can generate TOTP codes.</p>
    <div className="settingsChoice"><span><strong>Email verification</strong><small>{emailVerified ? "Your email address is verified and may be used as an additional factor." : "Verify your email address before enabling MFA."}</small></span>{!emailVerified && <button type="button" className="button" onClick={sendEmailVerification} disabled={busy}>Send verification email</button>}</div>
    <div className="settingsChoice"><span><strong>Authenticator app (TOTP)</strong><small>{totpVerified ? "Authenticator app verified." : "Set up a time-based code using an authenticator app."}</small></span>{!totpVerified && !secret && <button type="button" className="button" onClick={startAuthenticator} disabled={busy}>Set up authenticator</button>}</div>
    {secret && <div className="mfaSetup"><p><strong>Manual setup key</strong></p><code>{secret}</code><p>Enter this key in your authenticator app. Keep it private; anyone with this key can generate your codes.</p><label>Six-digit authenticator code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}/></label><button type="button" className="button" onClick={verifyAuthenticator} disabled={busy || otp.length!==6}>Verify authenticator</button></div>}
    <div className="settingsChoice"><span><strong>SMS or email sign-in challenge</strong><small>Available as additional factors after the phone number or email is verified in Appwrite.</small></span><span>{emailVerified ? "Email verified" : "Email pending"}</span></div>
    <p><strong>MFA status:</strong> {mfaEnabled ? "Enabled" : "Not enabled"}</p>
    {!mfaEnabled && totpVerified && (emailVerified || phoneVerified) && <button type="button" className="button" onClick={enableMfa} disabled={busy}>Enable multi-factor authentication</button>}
    {recoveryCodes.length>0 && <div className="mfaRecovery"><h3>One-time recovery codes</h3><p>Save these now in a password manager or other secure location. Each code can be used once. They will not be shown again.</p><ul>{recoveryCodes.map(code=><li key={code}><code>{code}</code></li>)}</ul><button type="button" className="button" onClick={()=>navigator.clipboard.writeText(recoveryCodes.join("\n"))}>Copy recovery codes</button></div>}
    {status && <p role="status" className="message">{status}</p>}{error && <p role="alert" className="message">{error}</p>}
  </section>;
}
