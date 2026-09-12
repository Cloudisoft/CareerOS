import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getSession, QUESTIONS_PER_SESSION } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const session = await getSession(profile.id, params.id);
    return apiOk({ session, totalQuestions: QUESTIONS_PER_SESSION });
  } catch (error) {
    return apiCatch(error);
  }
}
