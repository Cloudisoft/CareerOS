import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requestRunCommand } from "@/lib/autoapply/service";
import { autoApplyControlSchema } from "@/lib/validations/autoapply";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Start / Stop on the Auto Apply page. The paired browser picks the command up within a minute. */
export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { action } = autoApplyControlSchema.parse(await req.json());
    const settings = await requestRunCommand(profile.id, action);
    return apiOk({ runCommand: settings.runCommand, runCommandAt: settings.runCommandAt });
  } catch (error) {
    return apiCatch(error);
  }
}
