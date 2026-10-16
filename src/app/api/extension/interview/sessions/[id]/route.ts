import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { getSession, QUESTIONS_PER_SESSION } from "@/lib/interview/service";
import { extCatch, extOk } from "@/lib/extension/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const session = await getSession(profile.id, params.id);
    return extOk({ session, totalQuestions: QUESTIONS_PER_SESSION });
  } catch (error) {
    return extCatch(error);
  }
}
