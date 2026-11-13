"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { OneToOneCallRoom } from "@/app/components/one-to-one-call-room";
import "./calls.css";

type Call = { id: string; type: "voice" | "video"; status: string; outgoing: boolean; peerHandle: string; peerName: string; expiresAt: string };
type CallData = { incomingCalls: Call[]; outgoingCalls: Call[] };

export default function CallsPage() {
  const [data, setData] = useState<CallData>({ incomingCalls: [], outgoingCalls: [] });
  const [handle, setHandle] = useState("");
  const [type, setType] = useState<"voice" | "video">("voice");
  const [active, setActive] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/calls", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Calls are unavailable.");
      setData(result);
      const joined = [...(result.incomingCalls || []), ...(result.outgoingCalls || [])].find((call: Call) => call.status === "accepted");
      if (joined) setActive(joined);
      else setActive(current => current && current.status === "accepted" ? null : current);
    } catch (e) { setError(e instanceof Error ? e.message : "Calls are unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("with");
    if (requested && /^[a-z0-9_]{3,24}$/i.test(requested)) setHandle(requested.toLowerCase());
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 2500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function startCall(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientHandle: handle.trim().toLowerCase(), type }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Call could not be started.");
      setHandle("");
      setNotice("Calling " + (result.call.peerName || result.call.peerHandle) + "… They have 45 seconds to answer.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Call could not be started."); }
    finally { setBusy(false); }
  }

  async function action(call: Call, actionName: "accept" | "decline" | "end") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/calls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callId: call.id, action: actionName }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Call action could not be completed.");
      if (actionName === "accept") setActive({ ...call, status: "accepted" });
      if (actionName === "end" || actionName === "decline") setActive(null);
      setNotice(actionName === "accept" ? "Call accepted. Connecting…" : actionName === "decline" ? "Call declined." : "Call ended.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Call action could not be completed."); }
    finally { setBusy(false); }
  }

  if (active?.status === "accepted") {
    return <main className="connectFeatureShell"><ConnectSiteHeader /><section className="authCard callsCard">
      <OneToOneCallRoom callId={active.id} type={active.type} peerName={active.peerName} onEnd={() => void action(active, "end")} />
    </section></main>;
  }

  return <main className="connectFeatureShell"><ConnectSiteHeader />
    <section className="authCard callsCard">
      <div className="eyebrow">CONNECT · REAL-TIME</div><h1>Voice & video calls</h1>
      <p>Make private one-to-one calls with people in your accepted ConnectTime circle.</p>
      {error && <p className="message" role="alert">{error}</p>}{notice && <p className="message" role="status">{notice}</p>}
      <form className="callStartForm" onSubmit={startCall}>
        <label htmlFor="callHandle">Member handle</label>
        <input id="callHandle" value={handle} onChange={event => setHandle(event.target.value)} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" placeholder="Enter a connected member’s handle" required />
        <label htmlFor="callType">Call type</label>
        <select id="callType" value={type} onChange={event => setType(event.target.value as "voice" | "video")}><option value="voice">Voice only</option><option value="video">Video</option></select>
        <button type="submit" disabled={busy}>{busy ? "Starting…" : type === "video" ? "Start video call" : "Start voice call"}</button>
      </form>
      <section className="incomingCallsSection"><h2>Incoming calls</h2>
        {loading ? <p>Checking for calls…</p> : data.incomingCalls.length ? data.incomingCalls.map(call => <article className="incomingCallCard" key={call.id}><div><strong>{call.peerName || call.peerHandle}</strong><span>@{call.peerHandle} · {call.type} call</span></div><button disabled={busy} onClick={() => void action(call, "accept")}>Accept</button><button className="secondary" disabled={busy} onClick={() => void action(call, "decline")}>Decline</button></article>) : <p className="friendEmpty">No incoming calls right now. This page checks automatically while open.</p>}
      </section>
      <section className="incomingCallsSection"><h2>Outgoing calls</h2>
        {data.outgoingCalls.length ? data.outgoingCalls.map(call => <article className="incomingCallCard" key={call.id}><div><strong>{call.peerName || call.peerHandle}</strong><span>@{call.peerHandle} · {call.status === "accepted" ? "Connected" : "Ringing…"}</span></div><button className="secondary" disabled={busy} onClick={() => void action(call, "end")}>Cancel</button></article>) : <p className="friendEmpty">You have no active outgoing calls.</p>}
      </section>
      <p className="switch"><Link href="/messages">Back to messages</Link> · <Link href="/friends">Friends</Link> · <Link href="/safety">Safety Center</Link></p>
      <p className="callPrivacyNote">Allow microphone access for voice calls. Video calls also require camera permission. Calls are not recorded.</p>
    </section>
  </main>;
}
