import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await prisma.savedJob.upsert({
      where: { profileId_jobId: { profileId: profile.id, jobId: params.id } },
      update: {},
      create: { profileId: profile.id, jobId: params.id },
    });
    return apiOk({ saved: true });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await prisma.savedJob.deleteMany({ where: { profileId: profile.id, jobId: params.id } });
    return apiOk({ saved: false });
  } catch (error) {
    return apiCatch(error);
  }
}
