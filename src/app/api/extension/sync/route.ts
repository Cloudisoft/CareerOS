import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";
import { getOrCreateSettings, countAppliedThisMonth, listAppliedUrls } from "@/lib/autoapply/service";
import { getProfileForExtensionSync, buildExtensionProfile } from "@/lib/autoapply/adapter";
import { extCatch, extOk } from "@/lib/extension/response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);

    // Every plan, including Free, grants some amount of Auto Apply (see
    // plans.ts) — this only trips if entitlements are misconfigured, not as
    // a normal "upgrade to unlock" gate.
    if (!entitlements.autoApply || entitlements.monthlyApplicationLimit === 0) {
      return extOk({
        entitled: false,
        message: "Auto Apply isn't available on this account right now. Contact support if this seems wrong.",
      });
    }

    // Create the Career Profile row here rather than erroring on a missing
    // one — someone can reach the extension's connect flow without ever
    // having opened the web dashboard, and the whole point of syncing is to
    // hand back whatever profile data exists (even mostly empty) so the
    // extension always reflects the account rather than silently no-oping.
    const candidateProfile = await getOrCreateCandidateProfile(user.id);

    const [settings, appliedThisMonth, appliedUrls, fullProfile] = await Promise.all([
      getOrCreateSettings(candidateProfile.id),
      countAppliedThisMonth(candidateProfile.id),
      listAppliedUrls(candidateProfile.id),
      getProfileForExtensionSync(candidateProfile.id),
    ]);

    return extOk({
      entitled: true,
      settings: {
        minMatchScore: settings.minMatchScore,
        // Field name kept as `dailyLimit` for the extension's existing wire
        // contract (careeros-api.js/service-worker.js read this exact key) —
        // the value it carries is now this calendar month's application cap.
        dailyLimit: Math.min(settings.monthlyLimit, entitlements.monthlyApplicationLimit),
        pacingSeconds: settings.pacingSeconds,
        concurrency: settings.concurrency,
        autoSubmit: settings.autoSubmit,
        platformModes: settings.platformModes ?? {},
      },
      resume: { data: buildExtensionProfile(user, fullProfile) },
      appliedToday: appliedThisMonth,
      appliedUrls,
    });
  } catch (error) {
    return extCatch(error);
  }
}
