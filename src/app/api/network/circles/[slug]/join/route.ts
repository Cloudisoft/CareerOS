import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { joinCircle } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    await joinCircle(user.id, params.slug);
    return apiOk({ joined: true });
  } catch (error) {
    return apiCatch(error);
  }
}
