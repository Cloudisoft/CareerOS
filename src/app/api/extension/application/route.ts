import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { countAppliedThisMonth, logExtensionApplication } from "@/lib/autoapply/service";
import { extensionApplicationSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);
    if (!entitlements.autoApply || entitlements.monthlyApplicationLimit === 0) {
      return extError("Auto Apply is not enabled on your plan.", 402);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) return extError("Career Profile not found.", 404);

    const input = extensionApplicationSchema.parse(await req.json());
    // A submission that already happened is always recorded (refusing it would only hide it from the
    // tracker and from dedupe). The extension checks the limit before it applies, using /sync.
    const appliedThisMonth = await countAppliedThisMonth(candidateProfile.id);
    const overLimit = appliedThisMonth >= entitlements.monthlyApplicationLimit;
    const application = await logExtensionApplication(candidateProfile.id, input);

    return extOk({ ok: true, applicationId: application.id, limitReached: overLimit || appliedThisMonth + 1 >= entitlements.monthlyApplicationLimit });
  } catch (error) {
    return extCatch(error);
  }
}
