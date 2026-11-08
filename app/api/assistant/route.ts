import { NextResponse } from "next/server";

export const runtime = "nodejs";

const siteGuide = `
You are the Connect AI Guide, a friendly and concise website help assistant.
Connect is a social community concept for meeting friends, friend requests, text and video chat, photo/video posts, blogs, Marketplace, Connect Video Tube, forums, public and private Chat Rooms, news (including Sports, Politics and Entertainment), events, creator spaces, and adults-only dating.
Help users understand navigation, explain features in plain language, and answer general informational questions. Keep answers focused and welcoming.
Important accuracy rules:
- The current website includes preview/prototype areas. Do not claim that a feature is fully operational, that a user has successfully joined/published/paid/booked, or that live content exists unless the user has verified it in their own session.
- Chat Rooms currently have a client-side preview; rooms, messages, joining, and private invite-code validation are not yet backed by a shared production service.
- News category pages are a design preview, not a live licensed news feed.
- Connect Video Tube and other areas may be preview-only while backend work is completed.
- Dating is intended for adults 18+ only. Explain that reliable government-issued identity and age verification must be completed before access. Never suggest bypassing verification or upload identity documents into this chat.
- Do not ask for passwords, payment-card details, government ID numbers, identity documents, or other sensitive information. Never claim to access or change an account.
- If asked about account-specific issues, explain that you cannot inspect their account and direct them to the site's official support/contact route if available.
- If you do not know an answer, say so plainly rather than inventing a policy, feature, price, or support link.
`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI Guide is not connected yet. The site owner needs to add the OPENAI_API_KEY environment variable and redeploy." },
      { status: 503 },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send a valid question." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1200) {
    return NextResponse.json({ error: "Please enter a question up to 1,200 characters." }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-8).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as { role?: unknown; content?: unknown };
        if ((entry.role !== "user" && entry.role !== "assistant") || typeof entry.content !== "string") return [];
        return [{ role: entry.role, content: entry.content.slice(0, 1200) }];
      })
    : [];

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: process.env.CONNECT_AI_MODEL || "gpt-4.1-mini",
        instructions: siteGuide,
        input: history.length ? history : message,
        max_output_tokens: 450,
      }),
    });
    const result = await upstream.json();
    if (!upstream.ok) {
      console.error("Connect AI provider error", upstream.status, result?.error?.type || "unknown");
      return NextResponse.json({ error: "I couldn’t get an answer just now. Please try again shortly." }, { status: 502 });
    }
    const reply = typeof result.output_text === "string" ? result.output_text.trim() : "";
    if (!reply) return NextResponse.json({ error: "I didn’t receive a usable answer. Please try again." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Connect AI request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The AI Guide is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
