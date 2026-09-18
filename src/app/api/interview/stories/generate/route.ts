import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { generateStoryFromAnswer } from "@/lib/interview/story-bank";
import { apiCatch, apiOk } from "@/lib/api-response";

const generateSchema = z.object({ questionId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { questionId } = generateSchema.parse(await req.json());
    const story = await generateStoryFromAnswer(profile.id, questionId);
    return apiOk({ story });
  } catch (error) {
    return apiCatch(error);
  }
}
