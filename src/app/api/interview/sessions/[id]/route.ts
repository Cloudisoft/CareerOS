import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getSession } from "@/lib/interview/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const session = await getSession(profile.id, params.id);
    return apiOk({ session });
  } catch (error) {
    return apiCatch(error);
  }
}
