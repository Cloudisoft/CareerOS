import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { followCompany, unfollowCompany } from "@/lib/network/service";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

async function resolveCompanyId(slug: string) {
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  return company?.id ?? null;
}

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    const companyId = await resolveCompanyId(params.slug);
    if (!companyId) return apiError("This company could not be found.", 404, "NOT_FOUND");
    await followCompany(user.id, companyId);
    return apiOk({ following: true });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireCandidate();
    const companyId = await resolveCompanyId(params.slug);
    if (!companyId) return apiError("This company could not be found.", 404, "NOT_FOUND");
    await unfollowCompany(user.id, companyId);
    return apiOk({ following: false });
  } catch (error) {
    return apiCatch(error);
  }
}
