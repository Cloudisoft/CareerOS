import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isGoogleAuthConfigured, exchangeGoogleCode, GoogleAuthError } from "@/lib/auth/google";
import { findOrCreateGoogleUser, sendNewSignInAlert } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import type { UserRole } from "@prisma/client";

const STATE_COOKIE = "google_oauth_state";
const ACCOUNT_TYPE_COOKIE = "google_oauth_account_type";
const NEXT_COOKIE = "google_oauth_next";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fail = (reason: string) => NextResponse.redirect(`${appUrl}/login?error=${reason}`);

  if (!isGoogleAuthConfigured()) return fail("google_not_configured");

  const limit = rateLimit(`google-oauth:${ipFromRequest(req)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) return fail("rate_limited");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) return fail("google_auth_failed");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const accountType = (cookieStore.get(ACCOUNT_TYPE_COOKIE)?.value === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE") as UserRole;
  const next = cookieStore.get(NEXT_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(ACCOUNT_TYPE_COOKIE);
  cookieStore.delete(NEXT_COOKIE);

  if (!expectedState || state !== expectedState) return fail("google_auth_failed");

  try {
    const profile = await exchangeGoogleCode(code);
    if (!profile.email) return fail("google_auth_failed");

    const { user, isNewUser } = await findOrCreateGoogleUser(profile, accountType);
    await createSession(user.id);
    if (!isNewUser) {
      await sendNewSignInAlert(user, {
        ipAddress: ipFromRequest(req),
        userAgent: req.headers.get("user-agent"),
      });
    }

    // A caller that sent us here with somewhere specific to go back to (e.g.
    // the extension's connect handshake) takes priority over the default
    // post-signup destination — the cookie was already validated as an
    // in-app relative path when it was set.
    const destination = next || (isNewUser && user.role === "CANDIDATE" ? "/onboarding" : "/dashboard");
    return NextResponse.redirect(`${appUrl}${destination}`);
  } catch (error) {
    if (error instanceof GoogleAuthError) console.error("Google sign-in failed:", error);
    else console.error("Google sign-in callback error:", error);
    return fail("google_auth_failed");
  }
}
