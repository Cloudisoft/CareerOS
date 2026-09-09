import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { toggleReaction } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireCandidate();
    const liked = await toggleReaction(user.id, params.id);
    return apiOk({ liked });
  } catch (error) {
    return apiCatch(error);
  }
}
