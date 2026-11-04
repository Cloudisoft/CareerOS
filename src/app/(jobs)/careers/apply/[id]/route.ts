import { NextRequest, NextResponse } from "next/server";
import { applyUrlFor } from "@/lib/careers/service";

/**
 * "Apply Now" for a Career OS Careers listing. The destination is looked up
 * here, server-side, so it never appears in the page or the public API.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = await applyUrlFor(params.id);
  if (!url) return NextResponse.redirect(new URL("/careers?unavailable=1", req.url));
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
