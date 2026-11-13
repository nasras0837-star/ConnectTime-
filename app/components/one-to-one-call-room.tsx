"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, createLocalAudioTrack, createLocalVideoTrack, type LocalTrack } from "livekit-client";

type Props = { callId: string; type: "voice" | "video"; peerName: string; onEnd: () => void };

export function OneToOneCallRoom({ callId, type, peerName, onEnd }: Props) {
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState("Connecting securely…");
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === "video");
  const [error, setError] = useState("");
  const tracksRef = useRef<LocalTrack[]>([]);

  useEffect(() => {
    let mounted = true;
    const activeRoom = new Room({ adaptiveStream: true, dynacast: true });
    setRoom(activeRoom);
    const attachRemote = (track: import("livekit-client").Track) => {
      if (!mounted || !remoteRef.current) return;
      const element = track.attach();
      element.className = track.kind === Track.Kind.Video ? "callRemoteVideo" : "callRemoteAudio";
      remoteRef.current.appendChild(element);
    };
    const detachRemote = (track: import("livekit-client").Track) => {
      track.detach().forEach(element => element.remove());
    };
    activeRoom.on(RoomEvent.TrackSubscribed, attachRemote);
    activeRoom.on(RoomEvent.TrackUnsubscribed, detachRemote);
    activeRoom.on(RoomEvent.Disconnected, () => { if (mounted) setStatus("Call disconnected"); });

    void (async () => {
      try {
        const response = await fetch("/api/calls/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId }),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to join the call.");
        await activeRoom.connect(result.serverUrl, result.token);
        const audio = await createLocalAudioTrack();
        tracksRef.current.push(audio);
        await activeRoom.localParticipant.publishTrack(audio);
        if (type === "video") {
          const video = await createLocalVideoTrack();
          tracksRef.current.push(video);
          await activeRoom.localParticipant.publishTrack(video);
          const element = video.attach();
          element.className = "callLocalVideo";
          localRef.current?.appendChild(element);
        }
        if (mounted) setStatus("Connected");
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Could not connect. Check microphone and camera permissions.");
          setStatus("Connection failed");
        }
        await activeRoom.disconnect();
      }
    })();

    return () => {
      mounted = false;
      activeRoom.removeAllListeners();
      void activeRoom.disconnect();
      tracksRef.current.forEach(track => { track.stop(); track.detach().forEach(element => element.remove()); });
      tracksRef.current = [];
    };
  }, [callId, type]);

  async function toggleMute() {
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }

  async function toggleCamera() {
    if (!room || type !== "video") return;
    const next = !cameraOn;
    await room.localParticipant.setCameraEnabled(next);
    setCameraOn(next);
  }

  return <section className="oneToOneCallRoom" aria-label={type === "video" ? "Video call" : "Voice call"}>
    <header><div><span className="callLiveDot" /> {status}</div><strong>{peerName || "Connect member"}</strong><small>{type === "video" ? "Video call" : "Voice call"}</small></header>
    {error && <p role="alert" className="callError">{error}</p>}
    <div className="callMediaStage">
      <div ref={remoteRef} className="callRemoteStage"><div className="callWaiting">Waiting for the other participant’s media…</div></div>
      {type === "video" && <div ref={localRef} className="callLocalStage" aria-label="Your camera preview" />}
    </div>
    <div className="callControls">
      <button type="button" onClick={() => void toggleMute()} disabled={!room}>{muted ? "Unmute mic" : "Mute mic"}</button>
      {type === "video" && <button type="button" onClick={() => void toggleCamera()} disabled={!room}>{cameraOn ? "Turn camera off" : "Turn camera on"}</button>}
      <button type="button" className="callEndButton" onClick={onEnd}>End call</button>
    </div>
    <p className="callPrivacyNote">Calls are not recorded by ConnectTime. Use Report or Block if you feel unsafe.</p>
  </section>;
}
