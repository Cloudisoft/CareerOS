import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { takeRunCommand } from "@/lib/autoapply/service";
import { extCatch, extOk } from "@/lib/extension/response";

/** The extension checking (about once a minute) whether Start or Stop was pressed on the Auto Apply page. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    return extOk({ command: profile ? await takeRunCommand(profile.id) : null });
  } catch (error) {
    return extCatch(error);
  }
}
