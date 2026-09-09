import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { countAppliedToday, logExtensionApplication } from "@/lib/autoapply/service";
import { extensionApplicationSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);
    if (!entitlements.autoApply || entitlements.dailyApplicationLimit === 0) {
      return extError("Auto Apply is not enabled on your plan.", 402);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) return extError("Career Profile not found.", 404);

    const appliedToday = await countAppliedToday(candidateProfile.id);
    if (appliedToday >= entitlements.dailyApplicationLimit) {
      return extError("Daily Auto Apply limit reached.", 429);
    }

    const input = extensionApplicationSchema.parse(await req.json());
    const application = await logExtensionApplication(candidateProfile.id, input);

    return extOk({ ok: true, applicationId: application.id });
  } catch (error) {
    return extCatch(error);
  }
}
