import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listSessions, startSession, countSessionsThisMonth } from "@/lib/interview/service";
import { startInterviewSchema } from "@/lib/validations/interview";
import { extCatch, extError, extOk } from "@/lib/extension/response";

/**
 * Mirrors src/app/api/interview/sessions/* for the standalone practice-only
 * `interview-extension/` companion extension — same underlying
 * src/lib/interview/service.ts logic, authenticated by device-token bearer
 * (see requireExtensionCandidateProfile) instead of a browser session
 * cookie, since an extension background page can't hold one.
 */
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const sessions = await listSessions(profile.id);
    return extOk({ sessions });
  } catch (error) {
    return extCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    const { type, jobId } = startInterviewSchema.parse(await req.json());

    if (jobId && !entitlements.companyInterviewPrep) {
      return extError("Company Interview Preparation requires Premium or higher. Start a general practice session instead.", 402);
    }

    if (entitlements.interviewSessionMonthlyLimit !== Infinity) {
      const sessionsThisMonth = await countSessionsThisMonth(profile.id);
      if (sessionsThisMonth >= entitlements.interviewSessionMonthlyLimit) {
        return extError("You've reached this month's Interview AI session limit. Upgrade for more sessions.", 402);
      }
    }

    const session = await startSession(user.id, profile.id, type, jobId || undefined);
    return extOk({ session });
  } catch (error) {
    return extCatch(error);
  }
}
