import { createPublicKey, verify } from "node:crypto";

interface GithubClaims {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  repository?: string;
  repository_id?: string;
  ref?: string;
  event_name?: string;
  workflow_ref?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
}
interface Jwk { kid?: string; kty?: string; use?: string; alg?: string; [key: string]: unknown }

/**
 * Verifies GitHub Actions OIDC JWT cryptographically and binds it to precisely
 * the CareerOS installer workflow on main. This replaces shared upload tokens
 * and never gives CI access to Railway bucket credentials.
 */
export function verifyCompanionReleaseIdentity(token: string, jwks: { keys?: Jwk[] }, now = Math.floor(Date.now() / 1000)): boolean {
  try {
    if (!token || token.length > 16000 || !Array.isArray(jwks.keys)) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerPart, payloadPart, sigPart] = parts;
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")) as { alg?: string; kid?: string; typ?: string };
    const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as GithubClaims;
    if (header.alg !== "RS256" || !header.kid || !sigPart) return false;
    const key = jwks.keys.find((candidate) =>
      candidate.kid === header.kid && candidate.kty === "RSA" &&
      (!candidate.use || candidate.use === "sig") &&
      (!candidate.alg || candidate.alg === "RS256")
    );
    if (!key) return false;
    const publicKey = createPublicKey({ key: key as JsonWebKey, format: "jwk" });
    if (!verify("RSA-SHA256", Buffer.from(headerPart + "." + payloadPart), publicKey, Buffer.from(sigPart, "base64url"))) return false;

    if (claims.iss !== "https://token.actions.githubusercontent.com" ||
        !(claims.aud === "careeros-companion-release-v1" || (Array.isArray(claims.aud) && claims.aud.includes("careeros-companion-release-v1"))) ||
        claims.repository !== "Cloudisoft/CareerOS" ||
        claims.repository_id !== "1362954981" ||
        claims.ref !== "refs/heads/main" ||
        claims.sub !== "repo:Cloudisoft/CareerOS:ref:refs/heads/main" ||
        claims.event_name !== "push" ||
        claims.workflow_ref !== "Cloudisoft/CareerOS/.github/workflows/desktop-companion.yml@refs/heads/main") return false;

    if (typeof claims.exp !== "number" || typeof claims.iat !== "number" ||
        claims.exp <= now || claims.exp > now + 600 || claims.iat > now + 60 || claims.iat < now - 600) return false;
    if (claims.nbf !== undefined && claims.nbf > now + 60) return false;
    return true;
  } catch {
    return false;
  }
}
