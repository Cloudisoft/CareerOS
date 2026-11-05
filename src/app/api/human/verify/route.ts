import { NextRequest } from "next/server";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Checks a Cloudflare Turnstile token from the home page search before the
 * visitor is sent to log in. Without TURNSTILE_SECRET_KEY set, the check is
 * off and every request passes, so the search keeps working until the keys
 * are added.
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`human:${ipFromRequest(req)}`, 30, 10 * 60 * 1000).allowed) {
      return apiError("Too many attempts. Please wait a few minutes.", 429, "RATE_LIMITED");
    }
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return apiOk({ verified: true, enforced: false });

    const body = (await req.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token : "";
    if (!token || token.length > 4096) return apiError("Please complete the check.", 400, "VERIFICATION_FAILED");

    const form = new URLSearchParams({ secret, response: token });
    const ip = ipFromRequest(req);
    if (ip && ip !== "unknown") form.set("remoteip", ip);
    const res = await fetch(SITEVERIFY, { method: "POST", body: form, signal: AbortSignal.timeout(8000) }).catch(() => null);
    const result = (await res?.json().catch(() => null)) as { success?: boolean; "error-codes"?: string[] } | null;
    if (!result?.success) {
      if (result?.["error-codes"]?.length) console.warn("Turnstile rejected a token", result["error-codes"]);
      return apiError("We couldn't verify you're human. Please try again.", 400, "VERIFICATION_FAILED");
    }
    return apiOk({ verified: true, enforced: true });
  } catch (error) {
    return apiCatch(error);
  }
}
