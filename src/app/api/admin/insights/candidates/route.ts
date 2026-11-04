import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listCandidates } from "@/lib/admin/insights";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const p = req.nextUrl.searchParams;
    return apiOk(await listCandidates(p.get("q")?.trim().slice(0, 100) || undefined, p.get("filter") || undefined, Math.max(1, Number(p.get("page")) || 1)));
  } catch (error) {
    return apiCatch(error);
  }
}
