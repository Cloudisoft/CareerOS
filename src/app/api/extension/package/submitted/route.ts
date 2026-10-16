import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { extensionPackageSubmittedSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const { applicationId } = extensionPackageSubmittedSchema.parse(await req.json());

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) return extError("Career Profile not found.", 404);

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.profileId !== candidateProfile.id) {
      return extError("This application could not be found.", 404);
    }

    if (application.status !== "APPLIED") {
      await prisma.application.update({ where: { id: applicationId }, data: { status: "APPLIED" } });
      await prisma.applicationEvent.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: "APPLIED",
          note: "Confirmed submitted via a tailored application package.",
        },
      });
    }

    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
