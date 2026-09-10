import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listSessions, startSession, countSessionsThisMonth } from "@/lib/interview/service";
import { startInterviewSchema } from "@/lib/validations/interview";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const sessions = await listSessions(profile.id);
    return apiOk({ sessions });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    const { type, jobId } = startInterviewSchema.parse(await req.json());

    if (jobId && !entitlements.companyInterviewPrep) {
      return apiError(
        "Company Interview Preparation requires Premium or higher. Start a general practice session instead.",
        402,
        "UPGRADE_REQUIRED"
      );
    }

    if (entitlements.interviewSessionMonthlyLimit !== Infinity) {
      const sessionsThisMonth = await countSessionsThisMonth(profile.id);
      if (sessionsThisMonth >= entitlements.interviewSessionMonthlyLimit) {
        return apiError(
          "You've reached this month's Interview AI session limit. Upgrade for more sessions.",
          402,
          "UPGRADE_REQUIRED"
        );
      }
    }

    const session = await startSession(user.id, profile.id, type, jobId || undefined);
    return apiOk({ session });
  } catch (error) {
    return apiCatch(error);
  }
}
