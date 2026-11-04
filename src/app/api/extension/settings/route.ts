import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { updateExtensionSettings } from "@/lib/autoapply/service";
import { extensionSettingsSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

/** Settings changed in the extension's options page, saved so the Auto Apply page and other browsers see them. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile) return extError("Finish your Career Profile in Career OS first.", 404);
    const input = extensionSettingsSchema.parse(await req.json());
    const settings = await updateExtensionSettings(profile.id, input);
    return extOk({
      ok: true,
      settings: {
        minMatchScore: settings.minMatchScore,
        pacingSeconds: settings.pacingSeconds,
        concurrency: settings.concurrency,
        autoSubmit: settings.autoSubmit,
        platformModes: settings.platformModes ?? {},
      },
    });
  } catch (error) {
    return extCatch(error);
  }
}
