import { NextRequest } from "next/server";
import { getPublicCompanyBySlug } from "@/lib/company/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const company = await getPublicCompanyBySlug(params.slug);
    if (!company) return apiError("This company could not be found.", 404, "NOT_FOUND");

    return apiOk({
      company: {
        id: company.id,
        slug: company.slug,
        name: company.name,
        logoUrl: company.logoUrl,
        coverUrl: company.coverUrl,
        description: company.description,
        industry: company.industry,
        size: company.size,
        location: company.location,
        website: company.website,
        linkedinUrl: company.linkedinUrl,
        jobs: company.jobs.map((job) => ({
          id: job.id,
          title: job.title,
          location: job.location,
          workplaceType: job.workplaceType,
          employmentType: job.employmentType,
          careerLevel: job.careerLevel,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          createdAt: job.createdAt,
          skills: job.skills.map((s) => s.skill.name),
        })),
      },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
