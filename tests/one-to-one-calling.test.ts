import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const callsApi = readFileSync(resolve(process.cwd(), "app/api/calls/route.ts"), "utf8");
const tokenApi = readFileSync(resolve(process.cwd(), "app/api/calls/token/route.ts"), "utf8");
const callsPage = readFileSync(resolve(process.cwd(), "app/calls/page.tsx"), "utf8");
const room = readFileSync(resolve(process.cwd(), "app/components/one-to-one-call-room.tsx"), "utf8");
const env = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");

describe("ConnectTime one-to-one calling safeguards", () => {
  it("keeps calling disabled by default and requires same-origin authenticated mutations", () => {
    expect(env).toContain("ONE_TO_ONE_CALLS_ENABLED=false");
    expect(callsApi).toContain('process.env.ONE_TO_ONE_CALLS_ENABLED === "true"');
    expect(callsApi).toContain("sameOrigin(request)");
    expect(callsApi).toContain("currentCommunityMember()");
    expect(callsApi).toContain("checkMemberAccess()");
    expect(tokenApi).toContain("sameOrigin(request)");
  });

  it("restricts calls to eligible accepted connections and blocks either-direction blocks", () => {
    expect(callsApi).toContain('Query.equal("status", "accepted")');
    expect(callsApi).toContain("blocked(s, user.$id, profile.userId)");
    expect(callsApi).toContain("connected(s, user.$id, profile.userId)");
    expect(callsApi).toContain("RING_SECONDS = 45");
  });

  it("issues room-scoped short-lived tokens only to participants after acceptance", () => {
    expect(tokenApi).toContain('row.status !== "accepted"');
    expect(tokenApi).toContain('ttl: "10m"');
    expect(tokenApi).toContain("roomJoin: true");
    expect(tokenApi).toContain("TrackSource.MICROPHONE");
    expect(tokenApi).toContain("TrackSource.CAMERA");
    expect(tokenApi).toContain("LIVEKIT_API_SECRET");
    expect(tokenApi).toContain("blockedForward.rows.length || blockedReverse.rows.length");
  });

  it("provides separate voice and video modes and explicit accept/decline/end controls", () => {
    expect(callsPage).toContain('value="voice">Voice only');
    expect(callsPage).toContain('value="video">Video');
    expect(callsPage).toContain('"accept" | "decline" | "end"');
    expect(room).toContain("createLocalAudioTrack()");
    expect(room).toContain('if (type === "video")');
    expect(room).toContain("setMicrophoneEnabled");
    expect(room).toContain("setCameraEnabled");
  });

  it("does not include call recording or expose LiveKit secrets to the client", () => {
    expect(room.toLowerCase()).not.toContain("recording");
    expect(callsPage).not.toContain("LIVEKIT_API_SECRET");
    expect(tokenApi).toContain("Cache-Control");
  });
});
