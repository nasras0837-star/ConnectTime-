"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const adult = form.get("adult") === "on";
    if (!adult) { setMessage("You must confirm that you are 18 or older."); setBusy(false); return; }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage("Check your email to confirm your account. Your ConnectTime access remains restricted until adult eligibility is independently verified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup is not available yet.");
    } finally { setBusy(false); }
  }

  return <main className="authShell"><Link className="logo" href="/">Connect<span>Time</span></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">JOIN THE COMMUNITY</div><h1>Create your account</h1><p>ConnectTime is for adults aged 18 and over.</p><label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" minLength={12} autoComplete="new-password" required/></label><label className="consent"><input name="adult" type="checkbox" required/> I confirm that I am at least 18 years old.</label><button className="button" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>{message && <p role="status" className="message">{message}</p>}<small>Age confirmation is not identity verification. Full platform access stays locked until a trusted verification provider confirms adult eligibility.</small><p className="switch">Already registered? <Link href="/login">Log in</Link></p></form></main>;
}
