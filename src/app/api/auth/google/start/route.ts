import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, isGoogleConfigured, startGoogleAuth } from "@/lib/auth/google";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";

/** Sends the browser to Google. ?type=CANDIDATE|EMPLOYER from sign-up; no type from log-in. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const typeParam = params.get("type");
  const type = typeParam === "CANDIDATE" || typeParam === "EMPLOYER" ? typeParam : null;
  const next = safeNext(params.get("next"), "");
  const from = params.get("from") === "login" ? "/login" : params.get("from") === "signup" ? "/signup" : type ? "/signup" : "/login";
  const back = new URL(from, req.url);
  if (type) back.searchParams.set("as", type);

  if (!isGoogleConfigured()) {
    back.searchParams.set("error", "Google sign-in isn't set up yet. Use email and password for now.");
    return NextResponse.redirect(back);
  }
  if (!rateLimit(`google:${ipFromRequest(req)}`, 30, 15 * 60 * 1000).allowed) {
    back.searchParams.set("error", "Too many attempts. Please try again in a few minutes.");
    return NextResponse.redirect(back);
  }

  const { url, cookie } = startGoogleAuth(req.nextUrl.origin, type, next, from === "/login" ? "login" : "signup");
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_STATE_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60,
  });
  return res;
}
