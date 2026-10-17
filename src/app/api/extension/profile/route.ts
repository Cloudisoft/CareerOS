import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { saveExtensionProfileEdits } from "@/lib/autoapply/adapter";
import { extensionProfileSchema } from "@/lib/validations/autoapply";
import { extCatch, extError, extOk } from "@/lib/extension/response";

/** Profile fields edited in the extension, written to the Career Profile so the website shows the same details. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile) return extError("Finish your Career Profile in Career OS first.", 404);
    const edits = extensionProfileSchema.parse(await req.json());
    await saveExtensionProfileEdits(user.id, profile.id, edits);
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
