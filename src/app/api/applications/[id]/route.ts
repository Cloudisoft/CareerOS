import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { withdrawApplicationSchema } from "@/lib/validations/application";
import { withdrawApplication } from "@/lib/applications/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: { include: { company: true } },
        resume: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!application || application.profileId !== profile.id) {
      return apiError("This application could not be found.", 404, "NOT_FOUND");
    }
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const { note } = withdrawApplicationSchema.parse(await req.json());
    const application = await withdrawApplication(profile.id, params.id, note);
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}
