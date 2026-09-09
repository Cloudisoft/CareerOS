import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { respondToConnectionRequest } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ accept: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireCandidate();
    const { accept } = schema.parse(await req.json());
    const connection = await respondToConnectionRequest(user.id, params.id, accept);
    return apiOk({ connection });
  } catch (error) {
    return apiCatch(error);
  }
}
