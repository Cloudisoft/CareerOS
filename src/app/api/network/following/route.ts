import { requireCandidate } from "@/lib/auth/guards";
import { listFollowedCompanies } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user } = await requireCandidate();
    const companies = await listFollowedCompanies(user.id);
    return apiOk({ companies });
  } catch (error) {
    return apiCatch(error);
  }
}
