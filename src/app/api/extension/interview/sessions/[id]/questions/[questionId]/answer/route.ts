import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { submitAnswer } from "@/lib/interview/service";
import { submitAnswerSchema } from "@/lib/validations/interview";
import { extCatch, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const { answer } = submitAnswerSchema.parse(await req.json());
    const question = await submitAnswer(user.id, profile.id, params.id, params.questionId, answer);
    return extOk({ question });
  } catch (error) {
    return extCatch(error);
  }
}
