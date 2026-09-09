import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listResources } from "@/lib/learning/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    await requireEntitlement(user.id, "learning");

    const params = req.nextUrl.searchParams;
    const resources = await listResources({
      q: params.get("q")?.trim() || undefined,
      skill: params.get("skill")?.trim() || undefined,
      type: params.get("type")?.trim() || undefined,
    });
    return apiOk({ resources });
  } catch (error) {
    return apiCatch(error);
  }
}
