import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { toggleReaction } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  type: z.enum(["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "FUNNY"]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireCandidate();
    const { type } = schema.parse(await req.json().catch(() => ({})));
    const reaction = await toggleReaction(user.id, params.id, type);
    return apiOk({ reaction });
  } catch (error) {
    return apiCatch(error);
  }
}
