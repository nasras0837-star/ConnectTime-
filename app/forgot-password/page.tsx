"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

type RecoveryToken = { userId: string; phrase?: string };

export default function ForgotPasswordPage() {
  const { account } = useAppwrite();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [phrase, setPhrase] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!userId) {
        const token = await account.createRecoveryOTP({ email: email.trim(), phrase: true }) as RecoveryToken;
        setUserId(token.userId);
        setPhrase(token.phrase || "");
        setMessage("If an account exists for that email address, a recovery code is on its way. Check your inbox and spam folder.");
      } else {
        if (!/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code from your email.");
        if (password.length < 12) throw new Error("Your new password must contain at least 12 characters.");
        if (password !== confirmPassword) throw new Error("Your passwords do not match.");
        await account.updateRecoveryOTP({ userId, secret: code, password });
        setMessage("Your password has been reset. You can now sign in with your new password.");
        setUserId("");
        setCode("");
        setPassword("");
        setConfirmPassword("");
        setPhrase("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password recovery is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function requestAnotherCode() {
    setUserId("");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setPhrase("");
    setMessage("Enter your email address to request another recovery code.");
    setError("");
  }

  return (
    <main className="authShell">
      <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home">
        <img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage" />
      </Link>
      <form className="authCard" onSubmit={submit}>
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h1>Reset your password</h1>
        <p>{userId ? "Enter the six-digit code sent to your email and choose a new password." : "Enter the email address associated with your ConnectTime account. We’ll send a recovery code if an account exists."}</p>
        {!userId ? (
          <label>Email address
            <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
          </label>
        ) : (
          <>
            <label>Six-digit recovery code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
            </label>
            {phrase && <p className="message">Security phrase for this request: <strong>{phrase}</strong>. Check that it matches the phrase in your recovery email.</p>}
            <label>New password
              <input type="password" autoComplete="new-password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} required />
              <small>Use at least 12 characters.</small>
            </label>
            <label>Confirm new password
              <input type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
            </label>
          </>
        )}
        <button className="button" disabled={busy}>{busy ? "Please wait…" : userId ? "Reset password" : "Send recovery code"}</button>
        {message && <p role="status" className="message">{message}</p>}
        {error && <p role="alert" className="message">{error}</p>}
        {userId && <button type="button" className="button" onClick={requestAnotherCode} disabled={busy}>Use a different email / request another code</button>}
        <p className="switch"><Link href="/login">Back to log in</Link></p>
        <small>Recovery codes are single-use and expire after 15 minutes. Never share your code with anyone.</small>
      </form>
    </main>
  );
}
