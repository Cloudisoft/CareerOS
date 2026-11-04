import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listEnterprise } from "@/lib/admin/insights";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    return apiOk({ companies: await listEnterprise(req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) || undefined) });
  } catch (error) {
    return apiCatch(error);
  }
}
