import { NextRequest } from "next/server";
import { listPublicListings } from "@/lib/careers/service";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/** Public Career OS Careers listings. Never includes the apply URL. */
export async function GET(req: NextRequest) {
  try {
    if (!rateLimit(`careers:${ipFromRequest(req)}`, 120, 60 * 1000).allowed) return apiError("Too many requests.", 429, "RATE_LIMITED");
    const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) || undefined;
    return apiOk({ listings: await listPublicListings(q) });
  } catch (error) {
    return apiCatch(error);
  }
}
