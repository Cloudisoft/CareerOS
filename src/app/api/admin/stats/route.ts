import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getPlatformStats } from "@/lib/admin/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const stats = await getPlatformStats();
    return apiOk({ stats });
  } catch (error) {
    return apiCatch(error);
  }
}
