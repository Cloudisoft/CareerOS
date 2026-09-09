import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getOrCreateSettings, countAppliedToday, listAppliedUrls } from "@/lib/autoapply/service";
import { getProfileForExtensionSync, buildExtensionProfile } from "@/lib/autoapply/adapter";
import { extCatch, extOk } from "@/lib/extension/response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);

    if (!entitlements.autoApply || entitlements.dailyApplicationLimit === 0) {
      return extOk({
        entitled: false,
        message: "Auto Apply requires a Standard plan or higher. Upgrade in Career OS under Settings > Billing.",
      });
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) {
      return extOk({ entitled: false, message: "Finish your Career Profile in Career OS before running Auto Apply." });
    }

    const [settings, appliedToday, appliedUrls, fullProfile] = await Promise.all([
      getOrCreateSettings(candidateProfile.id),
      countAppliedToday(candidateProfile.id),
      listAppliedUrls(candidateProfile.id),
      getProfileForExtensionSync(candidateProfile.id),
    ]);

    return extOk({
      entitled: true,
      settings: {
        minMatchScore: settings.minMatchScore,
        dailyLimit: Math.min(settings.dailyLimit, entitlements.dailyApplicationLimit),
        pacingSeconds: settings.pacingSeconds,
        concurrency: settings.concurrency,
        autoSubmit: settings.autoSubmit,
        platformModes: settings.platformModes ?? {},
      },
      resume: { data: buildExtensionProfile(user, fullProfile) },
      appliedToday,
      appliedUrls,
    });
  } catch (error) {
    return extCatch(error);
  }
}
