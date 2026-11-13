import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const upload = readFileSync(resolve(process.cwd(), "app/api/video-tube/uploads/route.ts"), "utf8");
const webhook = readFileSync(resolve(process.cwd(), "app/api/webhooks/mux/route.ts"), "utf8");
const env = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
const setup = readFileSync(resolve(process.cwd(), "docs/CONNECT_VIDEO_TUBE_SHORT_CLIPS_SETUP.md"), "utf8");

describe("Mux Video Tube safety gates", () => {
  it("keeps uploads disabled unless both independent release flags are explicitly enabled", () => {
    expect(upload).toContain('process.env.VIDEO_UPLOADS_ENABLED !== "true"');
    expect(upload).toContain('process.env.VIDEO_MODERATION_PIPELINE_READY !== "true"');
    expect(env).toContain("VIDEO_UPLOADS_ENABLED=false");
    expect(env).toContain("VIDEO_MODERATION_PIPELINE_READY=false");
  });

  it("requires an authenticated, eligible member and creator rights attestation", () => {
    expect(upload).toContain("currentCommunityMember()");
    expect(upload).toContain("checkMemberAccess()");
    expect(upload).toContain("sameOrigin(request)");
    expect(upload).toContain("body.rightsAttested !== true");
  });

  it("stores each upload as a private pending-review record", () => {
    expect(upload).toContain('status: "pending_review"');
    expect(upload).toContain("mux_upload_id: muxData.data.id");
    expect(upload).toContain("tablesDB.createRow");
    expect(upload).toContain('playback_policies: ["signed"]');
  });

  it("verifies Mux webhook signatures with a five-minute timestamp tolerance", () => {
    expect(webhook).toContain('request.headers.get("mux-signature")');
    expect(webhook).toContain("timingSafeEqual");
    expect(webhook).toContain("SIGNATURE_TOLERANCE_SECONDS = 300");
    expect(webhook).toContain('if (!secret)');
  });

  it("never treats Mux processing readiness as moderation approval", () => {
    expect(webhook).toContain('data.status = "pending_review"');
    expect(webhook).toContain('data.mux_processing_status = "ready_pending_moderation"');
    expect(webhook).not.toContain('data.status = "approved"');
    expect(setup).toContain("Keep these settings false in every environment for now");
  });
});
