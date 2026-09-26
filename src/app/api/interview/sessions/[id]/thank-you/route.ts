import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { draftThankYouEmail } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "interviewAi");
    const draft = await draftThankYouEmail(user.id, profile.id, params.id);
    return apiOk({ draft: draft.text });
  } catch (error) {
    return apiCatch(error);
  }
}
