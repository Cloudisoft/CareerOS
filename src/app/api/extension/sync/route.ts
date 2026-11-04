import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getOrCreateSettings, countAppliedThisMonth, listAppliedUrls } from "@/lib/autoapply/service";
import { getProfileForExtensionSync, buildExtensionProfile } from "@/lib/autoapply/adapter";
import { listAnswers } from "@/lib/autoapply/answers";
import { extCatch, extOk } from "@/lib/extension/response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);

    if (!entitlements.autoApply || entitlements.monthlyApplicationLimit === 0) {
      return extOk({
        entitled: false,
        message: "Auto Apply is included from the Free plan — sign in and finish onboarding to activate it.",
      });
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) {
      return extOk({ entitled: false, message: "Finish your Career Profile in Career OS before running Auto Apply." });
    }

    const [settings, appliedThisMonth, appliedUrls, fullProfile, answers] = await Promise.all([
      getOrCreateSettings(candidateProfile.id),
      countAppliedThisMonth(candidateProfile.id),
      listAppliedUrls(candidateProfile.id),
      getProfileForExtensionSync(candidateProfile.id),
      listAnswers(candidateProfile.id),
    ]);
    const monthlyLimit = Math.min(settings.monthlyLimit, entitlements.monthlyApplicationLimit);

    return extOk({
      entitled: true,
      settings: {
        minMatchScore: settings.minMatchScore,
        // Field name kept as `dailyLimit` for the extension's existing wire
        // contract (careeros-api.js/service-worker.js read this exact key) —
        // the value it carries is now this calendar month's application cap.
        // Older extensions read this; current ones use monthlyLimit / appliedThisMonth below.
        dailyLimit: monthlyLimit,
        monthlyLimit: Number.isFinite(monthlyLimit) ? monthlyLimit : null,
        pacingSeconds: settings.pacingSeconds,
        concurrency: settings.concurrency,
        autoSubmit: settings.autoSubmit,
        platformModes: settings.platformModes ?? {},
      },
      resume: { data: buildExtensionProfile(user, fullProfile) },
      appliedToday: appliedThisMonth,
      appliedThisMonth,
      appliedUrls,
      answers: answers.map((a) => ({ key: a.questionKey, question: a.question, answer: a.answer, source: a.source })),
    });
  } catch (error) {
    return extCatch(error);
  }
}
