import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listSessions, startSession } from "@/lib/interview/service";
import { startInterviewSchema } from "@/lib/validations/interview";
import { apiCatch, apiOk } from "@/lib/api-response";

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
    await requireEntitlement(user.id, "interviewAi");
    const { type, jobId } = startInterviewSchema.parse(await req.json());
    const session = await startSession(user.id, profile.id, type, jobId || undefined);
    return apiOk({ session });
  } catch (error) {
    return apiCatch(error);
  }
}
