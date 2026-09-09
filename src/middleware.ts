import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// "/jobs" is intentionally public — browsing the marketplace doesn't require an
// account, only applying/saving does (enforced at the API layer, not here).
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/applications", "/auto-apply", "/resume-studio", "/ats-scanner", "/job-gpt", "/interview-ai", "/learning", "/network", "/messages", "/profile", "/notifications", "/employer", "/admin", "/settings"];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // This is a coarse, cookie-presence check only — the edge middleware can't
  // reach the database to validate the session. A present-but-stale cookie
  // (e.g. invalidated by a password reset elsewhere) still passes here; the
  // authoritative check happens in the (app) layout via getSessionUser(),
  // which redirects to /login itself if the session doesn't validate.
  // Deliberately not redirecting logged-in-looking users away from
  // /login or /signup here: doing that from a stale cookie previously
  // created a redirect loop against that authoritative check.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/applications/:path*",
    "/auto-apply/:path*",
    "/resume-studio/:path*",
    "/ats-scanner/:path*",
    "/job-gpt/:path*",
    "/interview-ai/:path*",
    "/learning/:path*",
    "/network/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
