import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GoogleAuthError,
  completeGoogleSignIn,
  exchangeGoogleCode,
  type GoogleOAuthState,
} from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { sendNewSignInAlert } from "@/lib/auth/service";
import { ipFromRequest } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  let st: GoogleOAuthState | null = null;
  try {
    st = JSON.parse(req.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "null");
  } catch {
    st = null;
  }
  const fail = (message: string, toSignup = st?.from ? st.from === "signup" : Boolean(st?.type)) => {
    const url = new URL(toSignup ? "/signup" : "/login", req.url);
    url.searchParams.set("error", message);
    if (st?.type) url.searchParams.set("as", st.type);
    if (st?.next) url.searchParams.set("next", st.next);
    const res = NextResponse.redirect(url);
    res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
    return res;
  };

  if (params.get("error")) return fail("Google sign-in was cancelled.");
  const code = params.get("code");
  if (!st || !code || params.get("state") !== st.state) return fail("Your Google sign-in expired. Please try again.");

  try {
    const profile = await exchangeGoogleCode(code, st.verifier, req.nextUrl.origin, st.nonce);
    const { user, created } = await completeGoogleSignIn(profile, st.type);
    await createSession(user.id);
    await writeAuditLog({ userId: user.id, action: created ? "auth.google.signup" : "auth.google.login", ipAddress: ipFromRequest(req) });
    if (!created) void sendNewSignInAlert(user, { ipAddress: ipFromRequest(req), userAgent: req.headers.get("user-agent") });

    let dest = safeNext(st.next, "");
    if (!dest || (created && !dest.startsWith("/extension-connect"))) {
      dest = created ? (user.role === "CANDIDATE" ? "/onboarding" : "/employer/company") : "/dashboard";
    }
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
    return res;
  } catch (error) {
    if (error instanceof GoogleAuthError) return fail(error.message, error.code === "GOOGLE_NO_ACCOUNT" ? true : undefined);
    console.error("Google sign-in failed", error);
    return fail("Google sign-in didn't complete. Please try again.");
  }
}
