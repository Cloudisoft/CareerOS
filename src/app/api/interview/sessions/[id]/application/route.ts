import { requireCandidate } from "@/lib/auth/guards";
import { getApplicationForSession } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Review step helper: resolves the application this session's job maps to,
    so the UI can offer a one-click "confirm stage" action. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const application = await getApplicationForSession(profile.id, params.id);
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}
