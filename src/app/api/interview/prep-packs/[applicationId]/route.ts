import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { getPrepPackForApplication } from "@/lib/interview/prep";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: { applicationId: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    if (!entitlements.companyInterviewPrep) {
      return apiError(
        "Company Interview Preparation requires Premium or higher.",
        402,
        "UPGRADE_REQUIRED"
      );
    }
    const prepPack = await getPrepPackForApplication(profile.id, params.applicationId);
    return apiOk({ prepPack });
  } catch (error) {
    return apiCatch(error);
  }
}
