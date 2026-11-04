import { describe, expect, it } from "vitest";
import { profileFromIdToken } from "./google";

const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (claims: object) => `${enc({ alg: "RS256" })}.${enc(claims)}.sig`;
const base = {
  aud: "client-1",
  iss: "https://accounts.google.com",
  exp: Math.floor(Date.now() / 1000) + 600,
  nonce: "n1",
  sub: "123",
  email: "Fakhruddin@SnyderStaffing.com",
  email_verified: true,
  given_name: "Fakhruddin",
  family_name: "Snyder",
};

describe("profileFromIdToken", () => {
  it("accepts a valid token and normalizes the email", () => {
    const p = profileFromIdToken(token(base), "n1", "client-1");
    expect(p.email).toBe("fakhruddin@snyderstaffing.com");
    expect(p.emailVerified).toBe(true);
    expect(p.givenName).toBe("Fakhruddin");
  });
  it("rejects another app's token, a wrong issuer, an expired token or a nonce mismatch", () => {
    expect(() => profileFromIdToken(token({ ...base, aud: "other" }), "n1", "client-1")).toThrow();
    expect(() => profileFromIdToken(token({ ...base, iss: "https://evil.example" }), "n1", "client-1")).toThrow();
    expect(() => profileFromIdToken(token({ ...base, exp: 1 }), "n1", "client-1")).toThrow();
    expect(() => profileFromIdToken(token(base), "other-nonce", "client-1")).toThrow();
  });
  it("reports an unverified email so it can be refused", () => {
    expect(profileFromIdToken(token({ ...base, email_verified: false }), "n1", "client-1").emailVerified).toBe(false);
  });
});
