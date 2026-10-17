import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Response helpers for the three routes the Chrome extension's own
 * `lib/careeros-api.js` calls directly (pair, connect/start, connect/poll).
 * That client expects the JSON body unwrapped (fields at the top level) and
 * a plain string `error`, unlike the rest of this app's `{ data }` / nested
 * `{ error: { message, code } }` convention used by our own frontend.
 */
export function extOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function extError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function extCatch(error: unknown) {
  if (error instanceof ZodError) {
    return extError(error.issues[0]?.message ?? "Invalid input", 422);
  }
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const err = error as { code: string; message: string };
    // Database errors (Prisma P2002, P2025, …) also carry code+message; never show those to users.
    if (/^P\d{4}$/.test(String(err.code))) {
      console.error(error);
      return extError("Something went wrong. Please try again.", 500);
    }
    const statusByCode: Record<string, number> = {
      RATE_LIMITED: 429,
      UNAUTHENTICATED: 401,
      UPGRADE_REQUIRED: 402,
      NO_PROFILE: 409,
      NOT_FOUND: 404,
      SESSION_COMPLETED: 409,
      VALIDATION_ERROR: 422,
      MONTHLY_LIMIT_REACHED: 429,
      CAMPAIGN_LIMIT_REACHED: 429,
      AI_NOT_CONFIGURED: 503,
    };
    return extError(err.message, statusByCode[err.code] ?? 400);
  }
  console.error(error);
  return extError("Something went wrong. Please try again.", 500);
}
