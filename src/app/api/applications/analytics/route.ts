import { requireCandidate } from "@/lib/auth/guards";
import { getApplicationAnalytics } from "@/lib/applications/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const analytics = await getApplicationAnalytics(profile.id);
    return apiOk({ analytics });
  } catch (error) {
    return apiCatch(error);
  }
}
