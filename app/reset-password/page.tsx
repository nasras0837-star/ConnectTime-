"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

export default function ResetPasswordPage() {
  const { account } = useAppwrite();
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Read the one-time recovery token after hydration to keep server/client markup consistent.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId") || "");
    setSecret(params.get("secret") || "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!userId || !secret) throw new Error("This reset link is incomplete. Request a new password-reset link.");
      if (password.length < 12) throw new Error("Your new password must contain at least 12 characters.");
      if (password !== confirmPassword) throw new Error("Your passwords do not match.");
      await account.updateRecovery({ userId, secret, password });
      setMessage("Your password has been reset. You can now sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed. Request a new link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home">
        <img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage" />
      </Link>
      <form className="authCard" onSubmit={submit}>
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h1>Choose a new password</h1>
        <p>Use at least 12 characters. Your reset link can only be used once.</p>
        {!userId || !secret ? <p role="alert" className="message">The reset link is missing information. <Link href="/forgot-password">Request a new link</Link>.</p> : <>
          <label>New password
            <input type="password" autoComplete="new-password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} required />
          </label>
          <label>Confirm new password
            <input type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
          </label>
          <button className="button" disabled={busy}>{busy ? "Please wait…" : "Reset password"}</button>
        </>}
        {message && <p role="status" className="message">{message}</p>}
        {error && <p role="alert" className="message">{error}</p>}
        <p className="switch"><Link href="/login">Back to log in</Link></p>
      </form>
    </main>
  );
}
