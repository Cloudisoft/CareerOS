import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { getFeed, createPost } from "@/lib/network/service";
import { assertValidImageDataUrl, assertValidVideoUrl } from "@/lib/upload/validate";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  content: z.string().trim().min(1).max(2000),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const { user } = await requireCandidate();
    const posts = await getFeed(user.id);
    return apiOk({ posts });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    const { content, imageUrl, videoUrl } = schema.parse(await req.json());
    if (imageUrl) assertValidImageDataUrl(imageUrl);
    if (videoUrl) assertValidVideoUrl(videoUrl);
    const post = await createPost(user.id, content, { imageUrl, videoUrl });
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
