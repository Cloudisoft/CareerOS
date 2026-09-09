import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { addComment } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(1000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireCandidate();
    const { content } = schema.parse(await req.json());
    const comment = await addComment(user.id, params.id, content);
    return apiOk({ comment });
  } catch (error) {
    return apiCatch(error);
  }
}
