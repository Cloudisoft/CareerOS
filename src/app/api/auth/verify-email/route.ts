import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/service";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const limit = rateLimit(`verify-email:${ipFromRequest(req)}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.redirect(`${appUrl}/verify-email?status=invalid`);
  }

  if (!token) {
    return NextResponse.redirect(`${appUrl}/verify-email?status=invalid`);
  }

  try {
    await verifyEmailToken(token);
    return NextResponse.redirect(`${appUrl}/verify-email?status=success`);
  } catch {
    return NextResponse.redirect(`${appUrl}/verify-email?status=invalid`);
  }
}
