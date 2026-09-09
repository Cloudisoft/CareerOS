import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { submitAnswer } from "@/lib/interview/service";
import { submitAnswerSchema } from "@/lib/validations/interview";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "interviewAi");
    const { answer } = submitAnswerSchema.parse(await req.json());
    const question = await submitAnswer(profile.id, params.id, params.questionId, answer);
    return apiOk({ question });
  } catch (error) {
    return apiCatch(error);
  }
}
