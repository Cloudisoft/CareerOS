import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { assertValidImageDataUrl } from "@/lib/upload/validate";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ dataUrl: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { dataUrl } = schema.parse(await req.json());
    assertValidImageDataUrl(dataUrl);
    await prisma.candidateProfile.update({ where: { id: profile.id }, data: { coverUrl: dataUrl } });
    return apiOk({ coverUrl: dataUrl });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE() {
  try {
    const { profile } = await requireCandidate();
    await prisma.candidateProfile.update({ where: { id: profile.id }, data: { coverUrl: null } });
    return apiOk({ coverUrl: null });
  } catch (error) {
    return apiCatch(error);
  }
}
