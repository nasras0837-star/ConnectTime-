"use client";

import Link from "next/link";
import { useState } from "react";

export default function VerificationPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function begin() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/verification/session", { method: "POST", cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) { window.location.assign("/login?next=%2Fverification"); return; }
      if (!response.ok) throw new Error(result.error === "verification_provider_not_configured" ? "Age verification is not ready yet. The site administrator must finish the Veriff and Appwrite setup." : result.error || "Could not start age verification.");
      if (result.status === "verified") { setMessage("Your account is already verified. Return to your account."); return; }
      if (typeof result.verificationUrl !== "string" || !result.verificationUrl.startsWith("https://")) throw new Error("The verification provider did not return a valid secure link.");
      window.location.assign(result.verificationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Age verification is temporarily unavailable.");
    } finally { setBusy(false); }
  }
  return <main className="authShell"><section className="authCard" style={{ width: "min(100%, 680px)" }}>
    <div className="eyebrow">CONNECT MEMBER ACCESS</div>
    <h1>Verify your age</h1>
    <p>Connect is for adults aged 18 and older. Independent identity and age verification is required before protected member features become available.</p>
    <p>Connect uses Veriff to securely complete the verification process. Your government ID is submitted directly through Veriff’s hosted verification flow; Connect does not ask you to upload an ID image to this website.</p>
    <p className="message">An 18+ checkbox during registration does not count as age verification. Access remains restricted until a verified result is received and confirmed by Connect.</p>
    <button className="button" type="button" onClick={() => void begin()} disabled={busy}>{busy ? "Preparing secure verification…" : "Continue to secure verification"}</button>
    {message && <p className="message" role="alert">{message}</p>}
    <p className="switch"><Link href="/account">Return to account</Link> · <Link href="/">Home</Link></p>
  </section></main>;
}
