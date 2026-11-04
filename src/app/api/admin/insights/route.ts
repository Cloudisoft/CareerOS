import { requirePlatformAdmin } from "@/lib/auth/guards";
import { insightsOverview } from "@/lib/admin/insights";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk(await insightsOverview());
  } catch (error) {
    return apiCatch(error);
  }
}
