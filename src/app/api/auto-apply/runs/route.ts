import { requireCandidate } from "@/lib/auth/guards";
import { listRecentRuns } from "@/lib/autoapply/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const runs = await listRecentRuns(profile.id);
    return apiOk({ runs });
  } catch (error) {
    return apiCatch(error);
  }
}
