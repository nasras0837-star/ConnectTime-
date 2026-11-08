import { describe, expect, it } from "vitest";
import {
  generateKeyPairSync,
  constants,
  verify,
} from "node:crypto";
import {
  buildYotiClientAssertion,
  buildYotiSandboxSessionRequest,
} from "./yoti-sandbox-core";

describe("Yoti sandbox client assertion", () => {
  it("creates a PS384 assertion with the expected issuer, audience, and short expiry", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const now = 1_800_000_000;
    const assertion = buildYotiClientAssertion(
      { sdkId: "sdk-test-id", privateKeyPem: privateKey },
      now,
      "unique-test-jti-0001",
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
      jti: "unique-test-jti-0001",
    });
    expect(verify(
      "sha384",
      Buffer.from(signingInput),
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_AUTO,
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
