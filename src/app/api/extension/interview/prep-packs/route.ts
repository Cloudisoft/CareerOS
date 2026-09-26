import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listPrepPacksForProfile } from "@/lib/interview/prep";
import { extCatch, extError, extOk } from "@/lib/extension/response";

/** Lists this candidate's prep packs so the Live Copilot (or a future
    extension UI) can let them pick which job's interview they're in. */
export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    if (!entitlements.companyInterviewPrep) {
      return extError("Company Interview Preparation requires Premium or higher.", 402);
    }
    const prepPacks = await listPrepPacksForProfile(profile.id);
    return extOk({
      prepPacks: prepPacks.map((p) => ({
        id: p.id,
        applicationId: p.applicationId,
        jobTitle: p.job.title,
        companyName: p.job.company.name,
        readinessScore: p.readinessScore,
      })),
    });
  } catch (error) {
    return extCatch(error);
  }
}
