import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { completeSession } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const session = await completeSession(profile.id, params.id);
    return apiOk({ session });
  } catch (error) {
    return apiCatch(error);
  }
}
