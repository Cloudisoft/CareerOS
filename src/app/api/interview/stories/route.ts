import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { listStories, createStory } from "@/lib/interview/story-bank";
import { apiCatch, apiOk } from "@/lib/api-response";

const storySchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(60),
  situation: z.string().trim().max(1000).default(""),
  task: z.string().trim().max(1000).default(""),
  action: z.string().trim().max(1500).default(""),
  result: z.string().trim().max(1000).default(""),
  reflection: z.string().trim().max(500).optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const stories = await listStories(profile.id);
    return apiOk({ stories });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = storySchema.parse(await req.json());
    const story = await createStory(profile.id, input);
    return apiOk({ story });
  } catch (error) {
    return apiCatch(error);
  }
}
