import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { lockStory, unlockStory, CORE_STORY_QUESTIONS } from "@/lib/interview/stories";
import { apiCatch, apiOk } from "@/lib/api-response";

const lockSchema = z.object({
  question: z.enum(CORE_STORY_QUESTIONS),
  answer: z.string().trim().max(4000).optional(),
});

const unlockSchema = z.object({ question: z.enum(CORE_STORY_QUESTIONS) });

/** Approves the current (or a supplied) wording as the final, locked answer. */
export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "interviewAi");
    const { question, answer } = lockSchema.parse(await req.json());
    const story = await lockStory(profile.id, question, answer);
    return apiOk({ story });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { question } = unlockSchema.parse(await req.json());
    await unlockStory(profile.id, question);
    return apiOk({ ok: true });
  } catch (error) {
    return apiCatch(error);
  }
}
