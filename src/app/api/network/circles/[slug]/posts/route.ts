import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { createPost, getCircle } from "@/lib/network/service";
import { assertValidImageDataUrl, assertValidVideoUrl } from "@/lib/upload/validate";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  content: z.string().trim().min(1).max(2000),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    const { content, imageUrl, videoUrl } = schema.parse(await req.json());
    if (imageUrl) assertValidImageDataUrl(imageUrl);
    if (videoUrl) assertValidVideoUrl(videoUrl);
    const circle = await getCircle(user.id, params.slug);
    const post = await createPost(user.id, content, { circleId: circle.id, imageUrl, videoUrl });
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
