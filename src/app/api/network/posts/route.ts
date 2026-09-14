import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { getFeed, createPost } from "@/lib/network/service";
import { assertValidImageDataUrl, assertValidVideoUrl } from "@/lib/upload/validate";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  content: z.string().trim().max(2000),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  repostOfId: z.string().optional(),
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
    const { content, imageUrl, videoUrl, repostOfId } = schema.parse(await req.json());
    // A repost may carry no added commentary; an original post always needs real content.
    if (!repostOfId && !content.trim()) throw new z.ZodError([{ code: "custom", message: "Say something in your post.", path: ["content"] }]);
    if (imageUrl) assertValidImageDataUrl(imageUrl);
    if (videoUrl) assertValidVideoUrl(videoUrl);
    const post = await createPost(user.id, content, { imageUrl, videoUrl, repostOfId });
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
