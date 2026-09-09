import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { recordRunHeartbeat } from "@/lib/autoapply/service";
import { extensionRunSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) return extError("Career Profile not found.", 404);

    const input = extensionRunSchema.parse(await req.json());
    await recordRunHeartbeat(candidateProfile.id, input);

    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
