import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { assertValidImageDataUrl } from "@/lib/upload/validate";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ dataUrl: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    const { dataUrl } = schema.parse(await req.json());
    assertValidImageDataUrl(dataUrl);
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: dataUrl } });
    return apiOk({ avatarUrl: dataUrl });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE() {
  try {
    const { user } = await requireCandidate();
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
    return apiOk({ avatarUrl: null });
  } catch (error) {
    return apiCatch(error);
  }
}
