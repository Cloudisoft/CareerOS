import { requireCandidate } from "@/lib/auth/guards";
import { getSessionRecap } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const recap = await getSessionRecap(profile.id, params.id);
    return apiOk({ recap });
  } catch (error) {
    return apiCatch(error);
  }
}
