"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (error) throw error;
      window.location.href = "/account";
    } catch (error) { setMessage(error instanceof Error ? error.message : "Login is not available yet."); }
    finally { setBusy(false); }
  }
  return <main className="authShell"><Link className="logo" href="/">Connect<span>Time</span></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1>Log in</h1><label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>{message && <p role="status" className="message">{message}</p>}<p className="switch">New to ConnectTime? <Link href="/signup">Create an account</Link></p></form></main>;
}
