import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { liveAssist } from "@/lib/interview/live";
import { extCatch, extError, extOk } from "@/lib/extension/response";

const assistSchema = z.object({
  /** Optional: the application this interview is for. Without it, help comes from the resume alone. */
  applicationId: z.string().trim().max(60).optional().nullable(),
  transcript: z.string().trim().max(2000),
  recent: z.array(z.string().trim().max(2000)).max(6).optional(),
  lastQuestion: z.string().trim().max(400).optional(),
});

/** Live Copilot: has the interviewer just asked something, and what could the candidate draw on? */
export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    const input = assistSchema.parse(await req.json());
    if (input.applicationId && !entitlements.companyInterviewPrep) {
      return extError("Help for a specific job's interview requires Premium or higher. Choose \"Use my resume\" instead.", 402);
    }
    const assist = await liveAssist(user.id, profile.id, input);
    return extOk({ assist });
  } catch (error) {
    return extCatch(error);
  }
}
