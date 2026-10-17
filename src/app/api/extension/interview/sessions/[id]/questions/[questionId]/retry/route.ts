import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { retryAnswer } from "@/lib/interview/service";
import { retryAnswerSchema } from "@/lib/validations/interview";
import { extCatch, extOk } from "@/lib/extension/response";

/** Mirrors src/app/api/interview/sessions/[id]/questions/[questionId]/retry
 * for the standalone interview-extension companion — see sessions/route.ts's
 * header comment. */
export async function POST(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const { answer } = retryAnswerSchema.parse(await req.json());
    const question = await retryAnswer(profile.id, params.id, params.questionId, answer);
    return extOk({ question });
  } catch (error) {
    return extCatch(error);
  }
}
