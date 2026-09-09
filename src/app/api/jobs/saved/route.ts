import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const saved = await prisma.savedJob.findMany({
      where: { profileId: profile.id },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiOk({
      jobs: saved.map((s) => ({
        id: s.job.id,
        title: s.job.title,
        location: s.job.location,
        workplaceType: s.job.workplaceType,
        salaryMin: s.job.salaryMin,
        salaryMax: s.job.salaryMax,
        company: { name: s.job.company.name, slug: s.job.company.slug },
        savedAt: s.createdAt,
      })),
    });
  } catch (error) {
    return apiCatch(error);
  }
}
