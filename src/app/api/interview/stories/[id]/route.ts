import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { updateStory, deleteStory } from "@/lib/interview/story-bank";
import { apiCatch, apiOk } from "@/lib/api-response";

const storyPatchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  situation: z.string().trim().max(1000).optional(),
  task: z.string().trim().max(1000).optional(),
  action: z.string().trim().max(1500).optional(),
  result: z.string().trim().max(1000).optional(),
  reflection: z.string().trim().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const input = storyPatchSchema.parse(await req.json());
    const story = await updateStory(profile.id, params.id, input);
    return apiOk({ story });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await deleteStory(profile.id, params.id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiCatch(error);
  }
}
