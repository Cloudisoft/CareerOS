import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listStories, practiceStory, CORE_STORY_QUESTIONS } from "@/lib/interview/stories";
import { apiCatch, apiOk } from "@/lib/api-response";

const practiceSchema = z.object({
  question: z.enum(CORE_STORY_QUESTIONS),
  answer: z.string().trim().min(1, "Write an answer before submitting.").max(4000),
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

/** Scores a draft answer and saves it — does not lock it. Use /lock to approve a final wording. */
export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "interviewAi");
    const { question, answer } = practiceSchema.parse(await req.json());
    const result = await practiceStory(profile.id, question, answer);
    return apiOk({ result });
  } catch (error) {
    return apiCatch(error);
  }
}
