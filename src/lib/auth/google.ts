import "server-only";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateToken, hashPassword } from "@/lib/auth/crypto";
import type { User } from "@prisma/client";

/**
 * Sign in with Google (OpenID Connect, authorization-code flow with PKCE).
 * The ID token comes straight from Google's token endpoint over TLS in
 * exchange for our client secret, so per the OIDC spec its claims can be
 * trusted without re-checking the signature; we still check audience,
 * issuer, expiry, nonce and that Google verified the email.
 */

export const GOOGLE_STATE_COOKIE = "careeros_google_oauth";
export type GoogleAccountType = "CANDIDATE" | "EMPLOYER";

export class GoogleAuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export interface GoogleOAuthState {
  state: string;
  verifier: string;
  nonce: string;
  /** null when started from the login page — only existing accounts may sign in. */
  type: GoogleAccountType | null;
  next: string;
}

export function startGoogleAuth(origin: string, type: GoogleAccountType | null, next: string) {
  const st: GoogleOAuthState = { state: generateToken(16), verifier: generateToken(32), nonce: generateToken(16), type, next };
  const challenge = b64url(createHash("sha256").update(st.verifier).digest());
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state: st.state,
    nonce: st.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, cookie: JSON.stringify(st) };
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
  picture: string | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new GoogleAuthError("Google returned an invalid sign-in token.", "GOOGLE_INVALID");
  return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
}

/** Validates ID-token claims. Exported for tests. */
export function profileFromIdToken(idToken: string, nonce: string, clientId: string, now = Date.now()): GoogleProfile {
  const c = decodeJwtPayload(idToken);
  if (c.aud !== clientId) throw new GoogleAuthError("This Google sign-in wasn't meant for Career OS.", "GOOGLE_INVALID");
  if (c.iss !== "https://accounts.google.com" && c.iss !== "accounts.google.com") throw new GoogleAuthError("Unexpected sign-in issuer.", "GOOGLE_INVALID");
  if (typeof c.exp !== "number" || c.exp * 1000 < now) throw new GoogleAuthError("This Google sign-in expired. Please try again.", "GOOGLE_INVALID");
  if (c.nonce !== nonce) throw new GoogleAuthError("This Google sign-in couldn't be verified. Please try again.", "GOOGLE_INVALID");
  if (typeof c.email !== "string" || !c.email) throw new GoogleAuthError("Google didn't share an email address.", "GOOGLE_INVALID");
  const name = typeof c.name === "string" ? c.name : "";
  return {
    sub: String(c.sub),
    email: c.email.toLowerCase(),
    emailVerified: c.email_verified === true || c.email_verified === "true",
    givenName: (typeof c.given_name === "string" && c.given_name) || name.split(" ")[0] || "Career OS",
    familyName: (typeof c.family_name === "string" && c.family_name) || name.split(" ").slice(1).join(" ") || "User",
    picture: typeof c.picture === "string" ? c.picture : null,
  };
}

export async function exchangeGoogleCode(code: string, verifier: string, origin: string, nonce: string): Promise<GoogleProfile> {
  // GOOGLE_TOKEN_URL exists only so end-to-end tests can stand in for Google.
  const res = await fetch(process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!res.ok) {
    console.error("Google token exchange failed", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new GoogleAuthError("Google sign-in didn't complete. Please try again.", "GOOGLE_FAILED");
  }
  const body = (await res.json()) as { id_token?: string };
  if (!body.id_token) throw new GoogleAuthError("Google sign-in didn't complete. Please try again.", "GOOGLE_FAILED");
  return profileFromIdToken(body.id_token, nonce, process.env.GOOGLE_CLIENT_ID!);
}

/**
 * Finds or creates the Career OS account for a Google profile.
 * - An existing account with that email signs in as it is (its type never changes).
 * - A new account is created as the type the person picked ("I'm job
 *   searching" → job seeker, "I'm hiring" → employer).
 * - From the login page (no type picked) a new email is refused, so the
 *   person chooses a type on the sign-up page first.
 */
export async function completeGoogleSignIn(profile: GoogleProfile, type: GoogleAccountType | null): Promise<{ user: User; created: boolean }> {
  if (!profile.emailVerified) {
    throw new GoogleAuthError("Your Google account's email isn't verified, so it can't be used to sign in.", "GOOGLE_UNVERIFIED");
  }
  const existing = await prisma.user.findFirst({ where: { email: { equals: profile.email, mode: "insensitive" } } });
  if (existing) {
    if (existing.deletedAt || existing.status !== "ACTIVE") {
      throw new GoogleAuthError("This account is not active. Contact support.", "ACCOUNT_INACTIVE");
    }
    // Google has verified this address, so the account's email is verified too.
    const updated = existing.emailVerified
      ? existing
      : await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: new Date(), ...(existing.avatarUrl ? {} : { avatarUrl: profile.picture }) } });
    return { user: updated, created: false };
  }
  if (!type) {
    throw new GoogleAuthError("There's no Career OS account for this Google email yet. Choose job searching or hiring to create one.", "GOOGLE_NO_ACCOUNT");
  }
  // No password is set; the account can add one any time with "Forgot password".
  const passwordHash = await hashPassword(generateToken(32));
  const user = await prisma.user.create({
    data: {
      email: profile.email,
      passwordHash,
      firstName: profile.givenName.slice(0, 80),
      lastName: profile.familyName.slice(0, 80),
      avatarUrl: profile.picture,
      emailVerified: new Date(),
      role: type,
      ...(type === "CANDIDATE" ? { candidateProfile: { create: {} } } : { employerProfile: { create: {} } }),
    },
  });
  return { user, created: true };
}
