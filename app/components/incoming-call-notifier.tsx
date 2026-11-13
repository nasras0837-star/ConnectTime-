"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type IncomingCall = { id: string; type: "voice" | "video"; peerName: string; peerHandle: string };

export function IncomingCallNotifier() {
  const router = useRouter();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ONE_TO_ONE_CALLS_ENABLED !== "true") return;
    let active = true;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/calls", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        const next = (result.incomingCalls || []).find((item: IncomingCall & { status: string }) => item.status === "ringing");
        if (active) setCall(next || null);
      } catch {
        // Keep the app usable during temporary connectivity issues.
      }
    };
    void check();
    const timer = window.setInterval(() => { void check(); }, 3500);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  async function respond(action: "accept" | "decline") {
    if (!call || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/calls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Call response could not be sent.");
      setCall(null);
      if (action === "accept") router.push("/calls");
    } catch {
      // The calls page remains available for retrying after a temporary error.
      setCall(null);
      router.push("/calls");
    } finally {
      setBusy(false);
    }
  }

  if (!call) return null;
  return <>
    <aside className="incomingCallToast" role="alert" aria-live="assertive">
      <div className="incomingCallToastIcon" aria-hidden="true">{call.type === "video" ? "▣" : "☎"}</div>
      <div className="incomingCallToastCopy"><strong>Incoming {call.type} call</strong><span>{call.peerName || call.peerHandle} · @{call.peerHandle}</span></div>
      <button type="button" disabled={busy} onClick={() => void respond("accept")}>Accept</button>
      <button type="button" className="incomingCallDecline" disabled={busy} onClick={() => void respond("decline")}>Decline</button>
    </aside>
    <style jsx global>{`
      .incomingCallToast{position:fixed;z-index:10000;right:18px;bottom:18px;display:flex;align-items:center;gap:12px;max-width:min(560px,calc(100vw - 24px));padding:14px 16px;border:1px solid rgba(102,177,255,.55);border-radius:18px;background:linear-gradient(135deg,#071a39,#10366a);box-shadow:0 18px 60px rgba(0,0,0,.48);color:#f5f9ff}
      .incomingCallToastIcon{display:grid;place-items:center;width:42px;height:42px;flex:none;border-radius:50%;background:#1769ff;font-size:20px}
      .incomingCallToastCopy{display:grid;gap:4px;min-width:0;flex:1}.incomingCallToastCopy span{font-size:12px;color:#c2dcff;overflow-wrap:anywhere}
      .incomingCallToast button{border:0;border-radius:999px;padding:9px 13px;background:#168b67;color:white;font-weight:700;cursor:pointer}.incomingCallToast button.incomingCallDecline{background:#9e2944}
      @media(max-width:540px){.incomingCallToast{right:10px;left:10px;bottom:10px;max-width:none;flex-wrap:wrap}.incomingCallToastCopy{min-width:calc(100% - 60px)}.incomingCallToast button{flex:1}}
    `}</style>
  </>;
}
