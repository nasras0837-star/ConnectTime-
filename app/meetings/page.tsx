"use client";

import Link from "next/link";
import { useState } from "react";

type MeetingGrant = { roomName: string; serverUrl: string; token: string; invitePath: string };

export default function MeetingsPage() {
  const [invite, setInvite] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [grant, setGrant] = useState<MeetingGrant | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestMeeting(roomName?: string) {
    setBusy(true); setError(""); setNotice(""); setGrant(null);
    try {
      const response = await fetch("/api/meetings/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomName ? { roomName } : {})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to prepare your meeting.");
      const nextGrant: MeetingGrant = data;
      setGrant(nextGrant);
      setInvite(window.location.origin + nextGrant.invitePath);
      setNotice(roomName ? "You're ready to join the meeting." : "Your meeting room is ready. Share the invitation with your guests.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to prepare your meeting.");
    } finally { setBusy(false); }
  }

  function joinMeeting() {
    if (!grant) return;
    const url = "https://meet.livekit.io/custom?liveKitUrl=" + encodeURIComponent(grant.serverUrl) + "&token=" + encodeURIComponent(grant.token);
    window.location.assign(url);
  }

  async function copyInvite() {
    if (!invite) return;
    try { await navigator.clipboard.writeText(invite); setNotice("Meeting invitation copied. Send it to your friends and family."); }
    catch { setNotice("Copy is unavailable in this browser. You can select and copy the invitation link."); }
  }

  function joinFromInvite() {
    const queryRoom = new URLSearchParams(window.location.search).get("room") || "";
    const typed = roomCode.trim();
    const candidate = typed || queryRoom;
    const match = candidate.match(/(?:[?&]room=)?(ct-[a-f0-9]{48})$/);
    if (!match) { setError("Paste a valid ConnectTime meeting invitation link or meeting code."); return; }
    void requestMeeting(match[1]);
  }

  return <main className="authShell meetingsShell">
    <header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/">🌐 ConnectTime</Link><nav><Link href="/">Home</Link><Link href="/friends">Friends</Link><Link href="/messages">Messages</Link></nav></header>
    <section className="authCard meetingsCard">
      <div className="eyebrow">CONNECTTIME · FACE-TO-FACE</div>
      <h1>Group video meetings</h1>
      <p>Bring your friends and family together in one video call. Start a room, share a private invitation, and meet face-to-face from your browser.</p>
      {error && <p className="message" role="alert">{error}</p>}
      {notice && <p className="message" role="status">{notice}</p>}
      <div className="meetingFeatureList">
        <div><span>🎥</span><section><strong>Group video & audio</strong><small>See and hear multiple people in the same meeting.</small></section></div>
        <div><span>🎙️</span><section><strong>Meeting controls</strong><small>Manage your microphone, camera, and screen sharing in the meeting room.</small></section></div>
        <div><span>🔗</span><section><strong>Private invitations</strong><small>Share a unique meeting link with the people you want to invite.</small></section></div>
      </div>
      <section className="meetingAction">
        <span className="eyebrow">START A NEW MEETING</span>
        <button className="button meetingPrimary" disabled={busy} onClick={()=>void requestMeeting()}>{busy ? "Preparing room…" : "＋ Create a group meeting"}</button>
      </section>
      <section className="meetingAction">
        <span className="eyebrow">JOIN AN EXISTING MEETING</span>
        <label>Invitation link or meeting code<input value={roomCode} onChange={e=>setRoomCode(e.target.value)} placeholder="Paste your ConnectTime meeting invitation"/></label>
        <button className="button meetingSecondary" disabled={busy} onClick={joinFromInvite}>{busy ? "Connecting…" : "Join meeting →"}</button>
      </section>
      {grant && <section className="meetingInvitePanel">
        <strong>Your ConnectTime meeting is ready</strong>
        <p>Share this invitation with friends and family. Each guest must sign in to an eligible ConnectTime account before joining.</p>
        <label>Private meeting invitation<input readOnly value={invite} onFocus={e=>e.currentTarget.select()}/></label>
        <div className="meetingInviteActions"><button className="button meetingSecondary" onClick={()=>void copyInvite()}>Copy invitation</button><button className="button meetingPrimary" onClick={joinMeeting}>Join meeting now ↗</button></div>
      </section>}
      <small>Meetings require a signed-in, independently verified adult account in good standing. Meeting links should be shared only with people you trust. Video calls are provided by the configured LiveKit service; ConnectTime does not record meetings by default.</small>
      <p className="switch"><Link href="/safety">Safety Center</Link> · <Link href="/account">Back to account</Link></p>
    </section>
    <footer className="plannedFeatureFooter">ConnectTime · Your people. Your passions. Your ConnectTime.</footer>
  </main>;
}
