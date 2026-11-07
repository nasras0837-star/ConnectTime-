"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";

export default function LoginPage() {
  const router = useRouter(); const { signIn, error } = useAuth(); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget);
    try { await signIn.emailPassword({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), onSuccess: () => { router.push("/account"); router.refresh(); } }); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Login is not available yet."); }
  }
  return <main className="authShell"><Link className="logo" href="/"><span className="ctBrandMark" aria-label="CT">CT</span><span className="ctWordmark">Connect<span>Time</span></span></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1>Log in</h1><label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={signIn.isPending}>{signIn.isPending ? "Signing in…" : "Log in"}</button>{(message || error) && <p role="status" className="message">{message || error?.message}</p>}<p className="switch">New to ConnectTime? <Link href="/signup">Create an account</Link></p></form></main>;
}
