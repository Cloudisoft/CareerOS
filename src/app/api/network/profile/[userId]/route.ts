import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getPublicProfile } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireCandidate();
    const profile = await getPublicProfile(user.id, params.userId);
    return apiOk({ profile });
  } catch (error) {
    return apiCatch(error);
  }
}
