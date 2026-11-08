import { describe, expect, it } from "vitest";
import {
  generateKeyPairSync,
  constants,
  verify,
} from "node:crypto";
import {
  buildYotiClientAssertion,
  buildYotiSandboxSessionRequest,
  isYotiSandboxOver18Pass,
} from "./yoti-sandbox-core";

describe("Yoti sandbox client assertion", () => {
  it("creates a PS384 assertion with the expected issuer, audience, and short expiry", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const now = 1_800_000_000;
    const testJti = "00000000-0000-4000-8000-000000000001";
    const assertion = buildYotiClientAssertion(
      { sdkId: "sdk-test-id", privateKeyPem: privateKey },
      now,
      testJti,
    );
    const [header, payload, signature] = assertion.split(".");
    const signingInput = `${header}.${payload}`;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    expect(JSON.parse(Buffer.from(header, "base64url").toString("utf8"))).toEqual({
      alg: "PS384",
      typ: "JWT",
    });
    expect(claims).toMatchObject({
      iss: "sdk:sdk-test-id",
      sub: "sdk:sdk-test-id",
      aud: "https://auth.api.yoti.com/v1/oauth/token",
      iat: now,
      exp: now + 300,
      jti: testJti,
    });
    expect(verify(
      "sha384",
      Buffer.from(signingInput),
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
      },
      Buffer.from(signature, "base64url"),
    )).toBe(true);
  });
});

describe("Yoti sandbox session request", () => {
  it("requests OVER 18 document scan and disables age estimation", () => {
    expect(buildYotiSandboxSessionRequest("opaque-reference")).toMatchObject({
      type: "OVER",
      ttl: 900,
      reference_id: "opaque-reference",
      doc_scan: { allowed: true, threshold: 18 },
      age_estimation: { allowed: false, threshold: 18 },
      digital_id: { allowed: false, threshold: 18 },
    });
  });

  it("rejects an empty reference", () => {
    expect(() => buildYotiSandboxSessionRequest("")).toThrow();
  });
});

describe("Yoti sandbox outcome policy", () => {
  const expected = {
    sessionId: "session-123",
    sdkId: "sdk-123",
    referenceId: "opaque-ref",
  };
  const valid = {
    id: expected.sessionId,
    sdk_id: expected.sdkId,
    type: "OVER",
    status: "COMPLETE",
    reference_id: expected.referenceId,
  };

  it("accepts only a matching completed OVER session in the sandbox", () => {
    expect(isYotiSandboxOver18Pass(valid, expected)).toBe(true);
  });

  it.each(["FAIL", "ERROR", "CANCELLED", "EXPIRED", "PENDING", "IN_PROGRESS", "UNKNOWN"])(
    "does not treat %s as a pass",
    (status) => {
      expect(isYotiSandboxOver18Pass({ ...valid, status }, expected)).toBe(false);
    },
  );

  it("rejects a session, SDK, type, or reference mismatch", () => {
    expect(isYotiSandboxOver18Pass({ ...valid, id: "other" }, expected)).toBe(false);
    expect(isYotiSandboxOver18Pass({ ...valid, sdk_id: "other" }, expected)).toBe(false);
    expect(isYotiSandboxOver18Pass({ ...valid, type: "AGE" }, expected)).toBe(false);
    expect(isYotiSandboxOver18Pass({ ...valid, reference_id: "other" }, expected)).toBe(false);
  });
});
