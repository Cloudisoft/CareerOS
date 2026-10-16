import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { lockStory, unlockStory, CORE_STORY_QUESTIONS } from "@/lib/interview/stories";
import { extCatch, extOk } from "@/lib/extension/response";

const lockSchema = z.object({
  question: z.enum(CORE_STORY_QUESTIONS),
  answer: z.string().trim().max(4000).optional(),
});
const unlockSchema = z.object({ question: z.enum(CORE_STORY_QUESTIONS) });

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const { question, answer } = lockSchema.parse(await req.json());
    const story = await lockStory(profile.id, question, answer);
    return extOk({ story });
  } catch (error) {
    return extCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const { question } = unlockSchema.parse(await req.json());
    await unlockStory(profile.id, question);
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
