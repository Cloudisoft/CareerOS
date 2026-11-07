import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { suggestAnswer } from "@/lib/interview/service";
import { extCatch, extOk } from "@/lib/extension/response";

/** A suggested answer for practising one mock-interview question, from the candidate's own resume and stories. */
export async function POST(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const suggestion = await suggestAnswer(user.id, profile.id, params.id, params.questionId);
    return extOk({ suggestion });
  } catch (error) {
    return extCatch(error);
  }
}
