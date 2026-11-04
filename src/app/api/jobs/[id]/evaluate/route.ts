import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { evaluateJob, getEvaluation } from "@/lib/evaluation/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const evaluation = await getEvaluation(profile.id, params.id);
    return apiOk({ evaluation });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "matchInsights");
    const evaluation = await evaluateJob(user.id, profile.id, params.id);
    return apiOk({ evaluation });
  } catch (error) {
    return apiCatch(error);
  }
}
