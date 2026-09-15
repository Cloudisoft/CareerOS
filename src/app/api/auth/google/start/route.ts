import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateToken } from "@/lib/auth/crypto";
import { isGoogleAuthConfigured, googleAuthorizeUrl } from "@/lib/auth/google";

const STATE_COOKIE = "google_oauth_state";
const ACCOUNT_TYPE_COOKIE = "google_oauth_account_type";
const NEXT_COOKIE = "google_oauth_next";
const COOKIE_TTL_SECONDS = 10 * 60; // just long enough for the Google consent screen

/** Only ever redirect somewhere inside this app — never an attacker-supplied host. */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const accountType = req.nextUrl.searchParams.get("accountType") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const state = generateToken(16);

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: COOKIE_TTL_SECONDS,
    path: "/",
  };
  cookieStore.set(STATE_COOKIE, state, cookieOpts);
  cookieStore.set(ACCOUNT_TYPE_COOKIE, accountType, cookieOpts);
  if (next) cookieStore.set(NEXT_COOKIE, next, cookieOpts);

  return NextResponse.redirect(googleAuthorizeUrl(state));
}
