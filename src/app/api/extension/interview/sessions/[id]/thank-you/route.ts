import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { draftThankYouEmail } from "@/lib/interview/service";
import { extCatch, extOk } from "@/lib/extension/response";

/** Mirrors src/app/api/interview/sessions/[id]/thank-you for the standalone
 * interview-extension companion — see sessions/route.ts's header comment. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const draft = await draftThankYouEmail(user.id, profile.id, params.id);
    return extOk({ draft: draft.text });
  } catch (error) {
    return extCatch(error);
  }
}
