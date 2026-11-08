"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

export default function ForgotPasswordPage() {
  const { account } = useAppwrite();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await account.createRecovery({
        email: email.trim(),
        url: `${window.location.origin}/reset-password`,
      });
      setMessage("If an account exists for that email address, Appwrite will send a password-reset link. Check your inbox and spam folder.");
    } catch {
      setError("We could not start password recovery. Check the email address and try again.");
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
        <h1>Reset your password</h1>
        <p>Enter the email address associated with your ConnectTime account. If an account exists, we’ll send a secure reset link.</p>
        <label>Email address
          <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <button className="button" disabled={busy}>{busy ? "Please wait…" : "Send reset link"}</button>
        {message && <p role="status" className="message">{message}</p>}
        {error && <p role="alert" className="message">{error}</p>}
        <p className="switch"><Link href="/login">Back to log in</Link></p>
        <small>Reset links are single-use. Never share a password-reset link with anyone.</small>
      </form>
    </main>
  );
}
