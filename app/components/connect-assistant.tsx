"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const welcome: Message = {
  role: "assistant",
  content: "Hi! I’m the Connect AI Guide. Ask me about features, finding communities, chat rooms, news, creators, or how to get around the website. What can I help you with?",
};

const suggestions = [
  "What can I do on Connect?",
  "How do Chat Rooms work?",
  "Tell me about Connect Video Tube",
  "How does adult dating verification work?",
];

export function ConnectAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, open]);

  async function sendMessage(value: string) {
    const question = value.trim();
    if (!question || pending) return;
    setDraft("");
    setError("");
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setPending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: next.slice(-9) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant is unavailable right now.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className="ctAssistant">
      {open && (
        <section className="ctAssistantPanel" aria-label="Connect AI help chat">
          <header className="ctAssistantHeader">
            <div className="ctAssistantAvatar" aria-hidden="true">✦</div>
            <div><strong>Connect AI Guide</strong><small>Website help & general questions</small></div>
            <button type="button" className="ctAssistantClose" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </header>
          <div className="ctAssistantMessages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`ctAssistantMessage ${message.role}`} key={index}>
                <span>{message.content}</span>
              </div>
            ))}
            {pending && <div className="ctAssistantMessage assistant"><span className="ctTyping">Thinking…</span></div>}
            {messages.length === 1 && !pending && (
              <div className="ctAssistantSuggestions">
                <small>QUICK QUESTIONS</small>
                {suggestions.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion} <b>↗</b></button>
                ))}
              </div>
            )}
            {error && <p className="ctAssistantError" role="alert">{error}</p>}
            <div ref={endRef} />
          </div>
          <form className="ctAssistantForm" onSubmit={submit}>
            <label className="sr-only" htmlFor="ct-assistant-input">Ask Connect a question</label>
            <input id="ct-assistant-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask me anything…" maxLength={1200} disabled={pending} />
            <button type="submit" disabled={pending || !draft.trim()} aria-label="Send message">➤</button>
          </form>
          <p className="ctAssistantPrivacy">AI-generated answers may be inaccurate. Don’t share passwords, payment details, or identity documents.</p>
        </section>
      )}
      <button className="ctAssistantLauncher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close Connect AI Guide" : "Open Connect AI Guide"}>
        <span aria-hidden="true">{open ? "×" : "✦"}</span>{!open && <b>Ask Connect</b>}
      </button>
    </div>
  );
}
