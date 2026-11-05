import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getCircle } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    const circle = await getCircle(user.id, params.slug);
    return apiOk({ circle });
  } catch (error) {
    return apiCatch(error);
  }
}
