import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { completeSession } from "@/lib/interview/service";
import { extCatch, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireExtensionCandidateProfile(req);
    const session = await completeSession(profile.id, params.id);
    return extOk({ session });
  } catch (error) {
    return extCatch(error);
  }
}
