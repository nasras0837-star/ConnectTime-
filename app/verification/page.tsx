"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const adminSetupItems = [
  "Add the Veriff API key and shared secret to the server environment. Keep both private; never use NEXT_PUBLIC_ variables for secrets.",
  "Set VERIFF_BASE_URL and VERIFF_CALLBACK_URL. The callback must be the HTTPS production URL ending in /api/verification/webhook.",
  "Create a private Appwrite verification_records table with user_id, provider, provider_session_id, verification_url, status, verified_at, created_at and updated_at columns.",
  "Add the required Appwrite access database and member-access collection settings, and set APPWRITE_VERIFICATION_RECORDS_TABLE_ID.",
  "Configure the Veriff decision webhook and verify its HMAC signature using a real sandbox callback.",
  "Test approved 18+, under-18, declined, inconclusive, expired, duplicate, invalid-signature and Appwrite-outage scenarios before enabling production access.",
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
      if (response.status === 401) {
        window.location.assign("/login?next=%2Fverification");
        return;
      }
      if (!response.ok) throw new Error(result.error === "verification_provider_not_configured"
        ? "Age verification is not ready yet. The site administrator must finish the Veriff and Appwrite setup."
        : result.error || "Could not start age verification.");
      if (result.status === "verified") {
        setMessage("Your account is already verified. Return to your account.");
        return;
      }
      if (typeof result.verificationUrl !== "string" || !result.verificationUrl.startsWith("https://")) {
        throw new Error("The verification provider did not return a valid secure link.");
      }
      window.location.assign(result.verificationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Age verification is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="authShell">
    <section className="authCard" style={{ width: "min(100%, 680px)" }}>
      <div className="eyebrow">CONNECT MEMBER ACCESS</div>
      <h1>Verify your age</h1>
      <p>Connect is for adults aged 18 and older. Independent identity and age verification is required before protected member features become available.</p>
      <p>Connect uses Veriff to securely complete the verification process. Your government ID is submitted directly through Veriff’s hosted verification flow; Connect does not ask you to upload an ID image to this website.</p>
      <p className="message">An 18+ checkbox during registration does not count as age verification. Access remains restricted until a verified result is received and confirmed by Connect.</p>

      {providerReady === true ? (
        <button className="button" type="button" onClick={() => void begin()} disabled={busy}>
          {busy ? "Preparing secure verification…" : "Continue to secure verification"}
        </button>
      ) : (
        <section className="message" role="status" aria-live="polite">
          <strong>Age verification is not ready yet.</strong>
          <p>The site administrator must finish the Veriff and Appwrite setup before members can start verification. Protected member features remain locked until a verified 18+ result is confirmed by the server.</p>
          {providerReady === null && <p>Checking verification service readiness…</p>}
          {providerReady === false && <div>
            <strong>Administrator setup checklist</strong>
            <ol>{adminSetupItems.map(item => <li key={item}>{item}</li>)}</ol>
            <p>See the deployment guide: <Link href="https://github.com/nasras0837-star/ConnectTime-/blob/main/docs/VERIFF-AGE-VERIFICATION-SETUP.md" target="_blank" rel="noreferrer">Veriff and Appwrite setup instructions</Link>.</p>
          </div>}
        </section>
      )}

      {message && <p className="message" role="alert">{message}</p>}
      <p className="switch"><Link href="/account">Return to account</Link> · <Link href="/">Home</Link></p>
    </section>
  </main>;
}
