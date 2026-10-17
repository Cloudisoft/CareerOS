import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { confirmApplicationStage } from "@/lib/applications/service";
import { confirmStageSchema } from "@/lib/validations/interview";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Review step: the candidate confirms/updates their own application's
    stage after an interview — never a silent auto-transition. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const { status, note } = confirmStageSchema.parse(await req.json());
    const application = await confirmApplicationStage(profile.id, params.id, status, note);
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}
