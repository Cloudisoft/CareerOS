import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { listAnswers, saveAnswers } from "@/lib/autoapply/answers";
import { extCatch, extError, extOk } from "@/lib/extension/response";

const saveSchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string().min(1).max(1000),
        answer: z.string().min(1).max(5000),
        key: z.string().max(200).optional(),
        source: z.enum(["user", "ai"]).optional(),
      })
    )
    .min(1)
    .max(60),
});

async function profileFor(req: NextRequest) {
  const user = await requireExtensionUser(req);
  return prisma.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
}

/** Answers the person gave on earlier forms, for the extension to reuse. */
export async function GET(req: NextRequest) {
  try {
    const profile = await profileFor(req);
    if (!profile) return extError("Career Profile not found.", 404);
    return extOk({ answers: await listAnswers(profile.id) });
  } catch (error) {
    return extCatch(error);
  }
}

/** Remember answers the person typed into a form, so the next form asking the same thing is filled. */
export async function POST(req: NextRequest) {
  try {
    const profile = await profileFor(req);
    if (!profile) return extError("Career Profile not found.", 404);
    const { answers } = saveSchema.parse(await req.json());
    return extOk({ ok: true, saved: await saveAnswers(profile.id, answers) });
  } catch (error) {
    return extCatch(error);
  }
}
