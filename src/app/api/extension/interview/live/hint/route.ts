import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { generateLiveHint } from "@/lib/interview/live";
import { extCatch, extOk } from "@/lib/extension/response";

const hintSchema = z.object({
  applicationId: z.string().min(1),
  transcript: z.string().trim().max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const { applicationId, transcript } = hintSchema.parse(await req.json());
    const hint = await generateLiveHint(profile.id, applicationId, transcript);
    return extOk({ hint });
  } catch (error) {
    return extCatch(error);
  }
}
