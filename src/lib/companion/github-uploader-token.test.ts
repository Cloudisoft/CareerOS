import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyCompanionReleaseIdentity } from "./github-uploader-token";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = { ...publicKey.export({ format: "jwk" }), kid: "test-key", use: "sig", alg: "RS256" };
const jwks = { keys: [key] };
const now = 1800000000;
const allowed = {
  iss: "https://token.actions.githubusercontent.com",
  aud: "careeros-companion-release-v1",
  repository: "Cloudisoft/CareerOS",
  repository_id: "1362954981",
  ref: "refs/heads/main",
  sub: "repo:Cloudisoft/CareerOS:ref:refs/heads/main",
  workflow_ref: "Cloudisoft/CareerOS/.github/workflows/desktop-companion.yml@refs/heads/main",
  event_name: "push",
  iat: now - 20, exp: now + 260, nbf: now - 20,
};
function token(claims: Record<string, unknown> = allowed) {
  const head = Buffer.from(JSON.stringify({ kid: "test-key", alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const input = head + "." + payload;
  return input + "." + sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
}

describe("CareerOS private installer release identity", () => {
  it("accepts only a valid signed token from our main branch workflow", () => {
    expect(verifyCompanionReleaseIdentity(token(), jwks, now)).toBe(true);
  });
  for (const [key, value] of Object.entries({
    ref: "refs/heads/feature/fake",
    sub: "repo:Cloudisoft/CareerOS:pull_request",
    workflow_ref: "Cloudisoft/CareerOS/.github/workflows/evil.yml@refs/heads/main",
    event_name: "pull_request",
    repository: "other/other",
    repository_id: "8",
    aud: "other",
    iss: "https://fake.example",
    exp: now - 1,
  })) {
    it("rejects mismatched " + key, () => {
      expect(verifyCompanionReleaseIdentity(token({ ...allowed, [key]: value }), jwks, now)).toBe(false);
    });
  }
  it("rejects tampered tokens, missing keys and malformed tokens", () => {
    const genuine = token();
    expect(verifyCompanionReleaseIdentity(genuine + "x", jwks, now)).toBe(false);
    expect(verifyCompanionReleaseIdentity(genuine, { keys: [] }, now)).toBe(false);
    expect(verifyCompanionReleaseIdentity("invalid", jwks, now)).toBe(false);
  });
});
