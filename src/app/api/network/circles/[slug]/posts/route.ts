import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { createPost, getCircle } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    const { content } = schema.parse(await req.json());
    const circle = await getCircle(user.id, params.slug);
    const post = await createPost(user.id, content, { circleId: circle.id });
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
