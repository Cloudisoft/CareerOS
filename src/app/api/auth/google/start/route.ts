import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateToken } from "@/lib/auth/crypto";
import { isGoogleAuthConfigured, googleAuthorizeUrl } from "@/lib/auth/google";

const STATE_COOKIE = "google_oauth_state";
const ACCOUNT_TYPE_COOKIE = "google_oauth_account_type";
const COOKIE_TTL_SECONDS = 10 * 60; // just long enough for the Google consent screen

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const accountType = req.nextUrl.searchParams.get("accountType") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
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

  return NextResponse.redirect(googleAuthorizeUrl(state));
}
