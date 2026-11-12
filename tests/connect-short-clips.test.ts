import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const clipsApi = readFileSync(resolve(process.cwd(), "app/api/video-tube/short-clips/route.ts"), "utf8");
const interestsApi = readFileSync(resolve(process.cwd(), "app/api/video-tube/interests/route.ts"), "utf8");
const studio = readFileSync(resolve(process.cwd(), "app/videos/short-clips.tsx"), "utf8");
const videoTube = readFileSync(resolve(process.cwd(), "app/videos/page.tsx"), "utf8");

describe("Connect Short Clips safety and discovery", () => {
  it("serves only approved clips and keeps creator drafts private", () => {
    expect(clipsApi).toContain('Query.equal("status","approved")');
    expect(clipsApi).toContain('Query.equal("user_id",user.$id)');
    expect(clipsApi).toContain('status:"draft"');
    expect(clipsApi).toContain("checkMemberAccess({requireAdultVerification:false})");
    expect(clipsApi).toContain("An active member account is required to watch clips.");
    expect(clipsApi).toContain("sameOrigin(request)");
  });

  it("keeps media upload and public publishing disabled until moderation is released", () => {
    expect(studio).toContain('type="file" accept="video/*" disabled');
    expect(studio).toContain("Uploads and publishing remain disabled");
    expect(clipsApi).not.toContain("createFile");
    expect(clipsApi).not.toContain('status:"approved"');
  });

  it("stores search signals per active member without an age-verification gate and integrates the clips feed", () => {
    expect(interestsApi).toContain('Query.equal("user_id",user.$id)');
    expect(interestsApi).toContain("checkMemberAccess({requireAdultVerification:false})");
    expect(interestsApi).toContain("inferTopic(query)");
    expect(videoTube).toContain("<ShortClips searchQuery={query} interests={interests} />");
    expect(videoTube).toContain("/api/video-tube/interests");
  });

  it("keeps creator draft creation age-verified and states the content policy", () => {
    expect(clipsApi).toContain("const access=await checkMemberAccess();");
    expect(studio).toContain("No nudity or sexually explicit content.");
    expect(studio).toContain("permission or a valid license");
    expect(studio).toContain("Profanity and strong language are allowed");
    expect(studio).toContain('type="file" accept="video/*" disabled');
  });
});
