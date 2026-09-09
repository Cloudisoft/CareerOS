import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** Normalizes any thrown error into a safe JSON response — never leaks internals. */
export function apiCatch(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(error.issues[0]?.message ?? "Invalid input", 422, "VALIDATION_ERROR");
  }
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const err = error as { code: string; message: string };
    const status = err.code === "INVALID_CREDENTIALS" || err.code === "EMAIL_TAKEN" ? 400 : 400;
    return apiError(err.message, status, err.code);
  }
  console.error(error);
  return apiError("Something went wrong. Please try again.", 500, "INTERNAL_ERROR");
}
