"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

type AppwriteError = { type?: string; code?: number; message?: string };

function recoveryError(error: unknown, fallback: string) {
  const value = error && typeof error === "object" ? error as AppwriteError : {};
  if (value.type === "user_invalid_token") return "This password-reset link is invalid or has expired. Request a new link.";
  if (value.type === "user_password_mismatch") return "The passwords do not match. Enter them again.";
  if (value.type === "password_recently_used") return "Choose a password you have not used recently.";
  if (value.type === "password_personal_data") return "Choose a password that does not contain your personal information.";
  if (value.type === "general_rate_limit_exceeded" || value.code === 429) return "Too many attempts. Wait a little while and try again.";
  return value.message?.trim() || fallback;
}

export default function ResetPasswordPage() {
  const { account } = useAppwrite();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Appwrite redirects to this exact page with one-time userId and secret parameters.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId") || "");
    setSecret(params.get("secret") || "");
    setTokenReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || sent) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await account.createRecovery({
        email: email.trim().toLowerCase(),
        url: `${window.location.origin}/reset-password`,
      });
      setSent(true);
      // Keep the response identical regardless of whether the address belongs to an account.
      setMessage("If an account exists for that email address, a secure password-reset link has been sent. Check your inbox and spam folder.");
    } catch (err) {
      const value = err && typeof err === "object" ? err as AppwriteError : {};
      if (value.type === "user_not_found") {
        setSent(true);
        setMessage("If an account exists for that email address, a secure password-reset link has been sent. Check your inbox and spam folder.");
      } else {
        setError(recoveryError(err, "We could not send a password-reset email. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!userId || !secret) throw new Error("This reset link is incomplete. Request a new password-reset link.");
      if (password.length < 12) throw new Error("Your new password must contain at least 12 characters.");
      if (password !== confirmPassword) throw new Error("Your passwords do not match.");
      // Appwrite validates the one-time recovery secret and changes the account password.
      await account.updateRecovery({ userId, secret, password });
      setComplete(true);
      setPassword("");
      setConfirmPassword("");
      setMessage("Your password has been reset successfully. You can now log in using your new password.");
    } catch (err) {
      setError(err instanceof Error && !("type" in err) ? err.message : recoveryError(err, "Password reset failed. Request a new link and try again."));
    } finally {
      setBusy(false);
    }
  }

  const hasRecoveryToken = Boolean(userId && secret);

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home">
      <img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" />
    </Link>
    <section className="authCard">
      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h1>{!tokenReady ? "Loading secure recovery…" : hasRecoveryToken ? "Choose a new password" : "Reset your password"}</h1>
      {!tokenReady ? <p role="status" className="message">Checking your password-reset link…</p> : complete ? <>
        <p role="status" className="message">{message}</p>
        <Link className="button" href="/login">Log in with your new password</Link>
      </> : hasRecoveryToken ? <form onSubmit={savePassword}>
        <p>Your secure reset link is ready. Choose a new password with at least 12 characters.</p>
        <label>New password
          <input type="password" autoComplete="new-password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} required />
        </label>
        <label>Confirm new password
          <input type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
        </label>
        <button className="button" disabled={busy}>{busy ? "Updating password…" : "Save new password"}</button>
      </form> : <form onSubmit={requestReset}>
        <p>Enter the email address on your Connect account. We’ll send a secure, one-time link to reset your login password.</p>
        <label>Email address
          <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <button className="button" disabled={busy || sent}>{busy ? "Sending reset link…" : sent ? "Reset email requested" : "Send reset link"}</button>
      </form>}
      {message && !complete && hasRecoveryToken === false && tokenReady && <p role="status" className="message">{message}</p>}
      {error && <p role="alert" className="message">{error}</p>}
      <p className="switch"><Link href="/login">Back to Log in</Link></p>
    </section>
  </main>;
}
