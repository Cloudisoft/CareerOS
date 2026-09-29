import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { getSessionRecap } from "@/lib/interview/service";
import { extCatch, extOk } from "@/lib/extension/response";

/** Mirrors src/app/api/interview/sessions/[id]/recap for the standalone
 * interview-extension companion — see sessions/route.ts's header comment. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const recap = await getSessionRecap(profile.id, params.id);
    return extOk({ recap });
  } catch (error) {
    return extCatch(error);
  }
}
