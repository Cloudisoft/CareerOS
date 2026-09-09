import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  visibility: z.enum(["PUBLIC", "RECRUITERS_ONLY", "PRIVATE_UNTIL_APPLY", "PRIVATE"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { visibility } = schema.parse(await req.json());
    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { visibility },
    });
    return apiOk({ visibility: updated.visibility });
  } catch (error) {
    return apiCatch(error);
  }
}
