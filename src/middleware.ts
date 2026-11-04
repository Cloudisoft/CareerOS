import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// "/jobs" is intentionally public — browsing the marketplace doesn't require an
// account, only applying/saving does (enforced at the API layer, not here).
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/applications", "/auto-apply", "/resume-studio", "/cover-letter-studio", "/ats-scanner", "/job-gpt", "/interview-ai", "/learning", "/network", "/messages", "/profile", "/notifications", "/employer", "/admin", "/settings", "/extension-connect", "/checkout"];
/**
 * The Chrome extension calls /api/extension/* from its own chrome-extension:// origin with a bearer
 * token (never cookies), so any extension origin may read the responses. Without these headers a
 * Web Store install can't reach the API unless the domain is in its manifest host permissions.
 */
function extensionCors(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://");
  const headers = new Headers();
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });
  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/extension/")) return extensionCors(request);
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
    // Keep the query string: /extension-connect?state=… is useless without its state.
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/extension/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/applications/:path*",
    "/auto-apply/:path*",
    "/resume-studio/:path*",
    "/cover-letter-studio/:path*",
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
    "/extension-connect",
    "/checkout/:path*",
  ],
};
