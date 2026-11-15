"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const setupSteps = [
  "Add VERIFF_API_KEY and VERIFF_SHARED_SECRET to Render as server-only secrets (never NEXT_PUBLIC variables).",
  "Set VERIFF_BASE_URL from Veriff’s API Keys page and VERIFF_CALLBACK_URL to the HTTPS production URL ending /api/verification/webhook.",
  "Create a private Appwrite verification_records table with user_id, provider, provider_session_id, verification_url, status, verified_at, created_at and updated_at columns; set APPWRITE_VERIFICATION_RECORDS_TABLE_ID.",
  "Confirm APPWRITE_API_KEY has least-privilege access to the verification table and member_access table.",
  "Configure the Veriff decision webhook, then test signed approved-18+, under-18, declined, review, expired, duplicate and invalid-signature events in sandbox.",
  "Confirm member routes remain denied until the signed callback confirms an approved decision and an 18+ date of birth.",
];

export default function VerificationPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [providerReady, setProviderReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/verification/status", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (response.status === 401) {
          window.location.assign("/login?next=%2Fverification");
          return;
        }
        if (active) setProviderReady(response.ok && result.providerReady === true);
      })
      .catch(() => { if (active) setProviderReady(false); });
    return () => { active = false; };
  }, []);

  async function begin() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/verification/session", { method: "POST", cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) { window.location.assign("/login?next=%2Fverification"); return; }
      if (!response.ok) throw new Error(result.error === "verification_provider_not_configured"
        ? "Age verification is not ready yet. The site administrator must finish the Veriff and Appwrite setup."
        : result.error || "Could not start age verification.");
      if (result.status === "verified") { setMessage("Your account is already verified. Return to your account."); return; }
      if (typeof result.verificationUrl !== "string" || !result.verificationUrl.startsWith("https://")) {
        throw new Error("The verification provider did not return a valid secure link.");
      }
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
    <div role="status" aria-live="polite" className="message" style={{ margin: "16px 0" }}>
      {providerReady === null ? "Checking secure verification setup…" : providerReady
        ? "Secure verification is configured. Continue to Veriff to verify your identity and age."
        : "Secure verification is not configured yet. Member access remains restricted while the administrator completes setup."}
    </div>
    <button className="button" type="button" onClick={() => void begin()} disabled={busy || providerReady !== true}>
      {busy ? "Preparing secure verification…" : providerReady === true ? "Continue to secure verification" : "Verification unavailable"}
    </button>
    {message && <p className="message" role="alert">{message}</p>}
    {providerReady === false && <details style={{ marginTop: 18 }}>
      <summary>Administrator setup checklist</summary>
      <ol>{setupSteps.map(step => <li key={step}>{step}</li>)}</ol>
      <p><Link href="/docs/VERIFF-AGE-VERIFICATION-SETUP.md" target="_blank">Open deployment setup guide</Link></p>
    </details>}
    <p className="switch"><Link href="/account">Return to account</Link> · <Link href="/">Home</Link></p>
  </section></main>;
}
