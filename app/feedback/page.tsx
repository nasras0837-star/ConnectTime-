"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const categories = [
  ["overall", "Overall experience"],
  ["design", "Design and ease of use"],
  ["features", "Features and functionality"],
  ["performance", "Speed and reliability"],
  ["safety", "Safety and community"],
  ["accessibility", "Accessibility and languages"],
  ["other", "Other"],
];

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (rating < 1 || rating > 5) {
      setStatus("Please select a rating from 1 to 5.");
      return;
    }
    setBusy(true);
    setStatus("Submitting your feedback…");
    const form = new FormData(formElement);
    const payload = {
      rating,
      category: String(form.get("category") || ""),
      feedback: String(form.get("feedback") || ""),
      idea: String(form.get("idea") || ""),
    };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Feedback could not be submitted.");
      setStatus("Thank you! Your feedback and ideas have been submitted.");
      setRating(0);
      formElement.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The feedback service is unavailable. Your response was not submitted.");
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle = { display: "grid", gap: 8, marginTop: 18 } as const;
  const inputStyle = { width: "100%", padding: "12px 13px", border: "1px solid #d9dbe7", borderRadius: 9, font: "inherit", background: "white" } as const;
  const buttonStyle = { border: 0, borderRadius: 10, padding: "13px 20px", background: "#6958d2", color: "white", fontWeight: 700, cursor: busy ? "wait" : "pointer", marginTop: 20, opacity: busy ? 0.7 : 1 } as const;

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage" /></Link>
    <section className="authCard" style={{ width: "min(100%, 680px)" }}>
      <div className="eyebrow">HELP SHAPE CONNECT</div>
      <h1>Share your feedback</h1>
      <p>Tell us how Connect is working for you. Your rating helps us understand the experience, and your ideas help us decide what to improve next.</p>
      <form onSubmit={submit}>
        <fieldset style={{ border: 0, padding: 0, margin: "20px 0 0" }}>
          <legend style={{ fontWeight: 700, marginBottom: 12 }}>How would you rate Connect? <span aria-hidden="true">*</span></legend>
          <div role="radiogroup" aria-label="Rating from 1 to 5" style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} onClick={() => setRating(value)} disabled={busy} style={{ minWidth: 54, minHeight: 48, borderRadius: 10, border: rating === value ? "2px solid #6958d2" : "1px solid #d9dbe7", background: rating === value ? "#f0edff" : "white", color: "#25213d", fontWeight: 800, fontSize: 18, cursor: "pointer" }}>{value}</button>)}
          </div>
          <p style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 7 }}><span>1 · Needs major improvement</span><span>5 · Excellent</span></p>
        </fieldset>
        <label style={fieldStyle}>What would you like to give feedback about?
          <select name="category" required style={inputStyle}>
            <option value="">Choose a topic</option>
            {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label style={fieldStyle}>Tell us about your experience <span style={{ fontWeight: 400, color: "#666" }}>(required)</span>
          <textarea name="feedback" required minLength={5} maxLength={2000} rows={5} style={inputStyle} placeholder="What worked well? What was confusing or frustrating?" />
        </label>
        <label style={fieldStyle}>What would you like us to improve or add? <span style={{ fontWeight: 400, color: "#666" }}>(optional)</span>
          <textarea name="idea" maxLength={2000} rows={4} style={inputStyle} placeholder="Share a feature idea, improvement, or something you would love to see." />
        </label>
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Submitting…" : "Submit feedback"}</button>
      </form>
      <p role="status" aria-live="polite" style={{ marginTop: 16 }}>{status}</p>
      <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>Please do not include passwords, payment details, government ID numbers, or other sensitive personal information. Feedback is associated with your signed-in account so we can understand member experience; it is not displayed publicly.</p>
      <p className="switch"><Link href="/">← Back to Connect</Link></p>
    </section>
  </main>;
}
