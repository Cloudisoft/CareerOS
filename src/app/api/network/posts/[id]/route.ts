import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getPost } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireCandidate();
    const post = await getPost(user.id, params.id);
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
