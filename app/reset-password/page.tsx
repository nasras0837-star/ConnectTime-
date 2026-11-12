"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

function friendlyMessage(error: unknown, fallback: string) {
  const value = error && typeof error === "object" ? error as { type?: string; code?: number; message?: string } : {};
  if (value.type === "user_not_found") return "No account was found for that email address. Check the address and try again.";
  if (value.type === "user_invalid_token") return "This password-reset link is invalid or has expired. Request a new link.";
  if (value.type === "user_password_mismatch") return "The passwords do not match. Enter them again.";
  if (value.type === "password_recently_used") return "Choose a password you have not used recently.";
  if (value.type === "general_rate_limit_exceeded" || value.code === 429) return "Too many attempts. Wait a little while and try again.";
  return value.message?.trim() || fallback;
}

export default function ResetPasswordPage() {
  const { account } = useAppwrite();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);

  useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUserId(params.get("userId") || "");
      setSecret(params.get("secret") || "");
    }
    return null;
  });

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await account.createRecovery({ email: email.trim().toLowerCase(), url: `${window.location.origin}/reset-password` });
      setSent(true);
      setMessage("If an account exists for that email, a password-reset link has been sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(friendlyMessage(err, "We could not send a password-reset email. Please try again."));
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    if (password !== passwordAgain) { setError("The passwords do not match."); return; }
    try {
      await account.updateRecovery({ userId, secret, password, passwordAgain });
      setComplete(true);
      setMessage("Your password has been updated. You can now log in with your new password.");
    } catch (err) {
      setError(friendlyMessage(err, "We could not update your password. Request a fresh reset link and try again."));
    }
  }

  const hasRecoveryToken = Boolean(userId && secret);

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
    <section className="authCard">
      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h1>{hasRecoveryToken ? "Choose a new password" : "Reset your password"}</h1>
      {complete ? <p role="status" className="message">{message}</p> : hasRecoveryToken ? <form onSubmit={savePassword}>
        <label>New password<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} required /></label>
        <button className="button">Save new password</button>
      </form> : <form onSubmit={requestReset}>
        <p>Enter the email address on your Connect account. We’ll send a secure link to reset your password.</p>
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <button className="button" disabled={sent}> {sent ? "Reset email requested" : "Send reset link"} </button>
      </form>}
      {message && !complete && <p role="status" className="message">{message}</p>}
      {error && <p role="alert" className="message">{error}</p>}
      <p className="switch"><Link href="/login">Back to Log in</Link></p>
    </section>
  </main>;
}
