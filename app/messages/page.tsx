"use client";

import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { useCallback, useEffect, useState } from "react";

type Message = { id: string; body: string; createdAt: string; mine: boolean; read: boolean };
type Peer = { handle: string; displayName: string; country: string };
type Conversation = { peer: Peer; preview: string; updatedAt: string; unreadCount: number };

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reportTarget, setReportTarget] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatus, setReportStatus] = useState("");

  const loadInbox = useCallback(async () => {
    const response = await fetch("/api/messages", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Inbox is unavailable.");
    setConversations(result.conversations || []);
  }, []);

  const openConversation = useCallback(async (selected: Peer) => {
    setPeer(selected);
    setError("");
    try {
      const response = await fetch("/api/messages?with=" + encodeURIComponent(selected.handle), { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Conversation is unavailable.");
      setPeer(result.peer || selected);
      setMessages(result.messages || []);
      await fetch("/api/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ peerHandle: selected.handle }) });
      await loadInbox();
    } catch (e) { setError(e instanceof Error ? e.message : "Conversation is unavailable."); }
  }, [loadInbox]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/messages", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Inbox is unavailable.");
      const items: Conversation[] = result.conversations || [];
      if (!cancelled) {
        setConversations(items);
        const requestedHandle = new URLSearchParams(window.location.search).get("with")?.toLowerCase();
        const requested = items.find(item => item.peer.handle === requestedHandle);
        if (requested) void openConversation(requested.peer);
        else if (requestedHandle && /^[a-z0-9_]{3,24}$/.test(requestedHandle)) {
          void openConversation({ handle: requestedHandle, displayName: requestedHandle, country: "" });
        }
      }
    }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Inbox is unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [openConversation]);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await loadInbox();
        if (peer) {
          const response = await fetch("/api/messages?with=" + encodeURIComponent(peer.handle), { cache: "no-store" });
          const result = await response.json();
          if (response.ok && result.peer?.handle === peer.handle) {
            setMessages(result.messages || []);
            await fetch("/api/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ peerHandle: peer.handle }) });
          }
        }
      } catch {
        // Keep the current conversation visible during temporary network interruptions.
      }
    };
    const interval = window.setInterval(() => { void poll(); }, 8000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [peer, loadInbox]);

  function startConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const handle = newHandle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
      setError("Enter a valid Connect handle (3–24 letters, numbers, or underscores).");
      return;
    }
    setNewHandle("");
    void openConversation({ handle, displayName: handle, country: "" });
  }

  async function reportMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget || reportDetails.trim().length < 10) return;
    setReportStatus("Submitting report…");
    try {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "harassment", targetType: "message", contentReference: reportTarget, details: reportDetails.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report could not be submitted.");
      setReportStatus(result.message || "Report submitted.");
      setReportTarget("");
      setReportDetails("");
    } catch (e) {
      setReportStatus(e instanceof Error ? e.message : "Report service unavailable.");
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!peer || !draft.trim() || sending) return;
    setSending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: peer.handle, body: draft.trim() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Message could not be sent.");
      setMessages(current => [...current, result.message]);
      setDraft("");
      await loadInbox();
      setNotice("Message sent.");
    } catch (e) { setError(e instanceof Error ? e.message : "Message could not be sent."); }
    finally { setSending(false); }
  }

  return <main className="connectFeatureShell"><ConnectSiteHeader />
    <section className="authCard messagesCard"><div className="eyebrow">YOUR PRIVATE CIRCLE</div><h1>Messages</h1><p>Private one-to-one messages are available between eligible members who are already connected.</p>
      {error && <p className="message" role="alert">{error}</p>}{notice && <p className="message" role="status">{notice}</p>}
      <div className="messagesLayout"><aside className="messageInbox"><h2>Inbox</h2><form onSubmit={startConversation} className="messageStartForm"><label htmlFor="messageNewHandle">Start a conversation</label><div><input id="messageNewHandle" value={newHandle} onChange={event => setNewHandle(event.target.value)} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" placeholder="Member handle" required/><button type="submit">Open</button></div><small>Only accepted connections can exchange private messages.</small></form>{loading ? <p>Loading conversations…</p> : conversations.length ? conversations.map(item => <button key={item.peer.handle} className={peer?.handle === item.peer.handle ? "conversationChoice selected" : "conversationChoice"} onClick={() => void openConversation(item.peer)}><strong>{item.peer.displayName}</strong><span>@{item.peer.handle}</span><small>{item.preview}</small>{item.unreadCount > 0 && <em>{item.unreadCount} new</em>}</button>) : <p className="friendEmpty">No conversations yet. Connect with a member to start a private conversation.</p>}</aside>
        <section className="messageThread">{peer ? <><header><strong>{peer.displayName}</strong><span>@{peer.handle}{peer.country ? " · " + peer.country : ""}</span><Link href={"/calls?with=" + encodeURIComponent(peer.handle)}>Call</Link></header><div className="messageHistory" aria-live="polite">{messages.length ? messages.map(item => <article key={item.id} className={item.mine ? "messageBubble mine" : "messageBubble"}><p>{item.body}</p><time>{new Date(item.createdAt).toLocaleString()}</time>{item.mine && <small className="messageReadReceipt" aria-label={item.read ? "Read by recipient" : "Sent, not yet read"}>{item.read ? "Read" : "Sent"}</small>}{!item.mine && <button type="button" className="messageReportButton" onClick={() => { setReportTarget(item.id); setReportStatus(""); }}>Report message</button>}</article>) : <p className="friendEmpty">This is the beginning of your conversation.</p>}</div>{reportTarget && <form className="messageReportForm" onSubmit={reportMessage}><strong>Report this message</strong><p>Tell our safety team what is concerning. Reports are private.</p><textarea value={reportDetails} onChange={event => setReportDetails(event.target.value)} minLength={10} maxLength={3000} rows={3} placeholder="Describe the concern (at least 10 characters)." required/><div><button type="submit" disabled={reportDetails.trim().length < 10}>Submit report</button><button type="button" className="secondary" onClick={() => setReportTarget("")}>Cancel</button></div>{reportStatus && <p role="status">{reportStatus}</p>}</form>}<form onSubmit={sendMessage}><label htmlFor="messageDraft">Message</label><textarea id="messageDraft" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Write a respectful message…" required/><div><small>{draft.length}/2000</small><button type="submit" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send message"}</button></div></form></> : <div className="messageThreadEmpty"><h2>Select a conversation</h2><p>Choose a connection from your inbox to view your messages.</p><Link href="/discover">Discover members</Link></div>}</section></div>
      <p className="switch"><Link href="/account">Back to account</Link> · <Link href="/calls">Voice & video calls</Link> · <Link href="/safety">Safety Center</Link></p>
    </section><footer className="plannedFeatureFooter">Connect · Your people. Your passions. Your Connect.</footer>
  </main>;
}
