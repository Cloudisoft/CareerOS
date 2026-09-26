import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listStories, practiceStory, CORE_STORY_QUESTIONS } from "@/lib/interview/stories";
import { extCatch, extOk } from "@/lib/extension/response";

const practiceSchema = z.object({
  question: z.enum(CORE_STORY_QUESTIONS),
  answer: z.string().trim().min(1, "Write an answer before submitting.").max(4000),
});

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const stories = await listStories(profile.id);
    return extOk({ stories });
  } catch (error) {
    return extCatch(error);
  }
}

/** Scores a draft answer and saves it — does not lock it. Use /lock to approve a final wording. */
export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const { question, answer } = practiceSchema.parse(await req.json());
    const result = await practiceStory(profile.id, question, answer);
    return extOk({ result });
  } catch (error) {
    return extCatch(error);
  }
}
