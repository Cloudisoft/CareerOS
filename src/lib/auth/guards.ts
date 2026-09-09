import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";

export class UnauthenticatedError extends Error {
  code = "UNAUTHENTICATED";
}
export class ForbiddenRoleError extends Error {
  code = "FORBIDDEN";
}
export class NeedsCompanyError extends Error {
  code = "NEEDS_COMPANY";
}

export async function requireCandidate() {
  const user = await getSessionUser();
  if (!user) throw new UnauthenticatedError("Not authenticated");
  if (user.role !== "CANDIDATE") throw new ForbiddenRoleError("This action requires a candidate account");

  const profile = await getOrCreateCandidateProfile(user.id);
  return { user, profile };
}

export async function requirePlatformAdmin() {
  const user = await getSessionUser();
  if (!user) throw new UnauthenticatedError("Not authenticated");
  if (user.role !== "PLATFORM_ADMIN") throw new ForbiddenRoleError("This action requires a platform admin account");
  return { user };
}

export async function requireEmployer() {
  const user = await getSessionUser();
  if (!user) throw new UnauthenticatedError("Not authenticated");
  if (user.role !== "EMPLOYER" && user.role !== "COMPANY_ADMIN") {
    throw new ForbiddenRoleError("This action requires an employer account");
  }
  return { user };
}

/** Employer routes that operate on a specific company — throws NEEDS_COMPANY until they create one. */
export async function requireEmployerCompany() {
  const { user } = await requireEmployer();

  const membership = await prisma.companyMember.findFirst({
    where: { userId: user.id },
    include: { company: true },
  });
  if (!membership) throw new NeedsCompanyError("Create your company profile to continue");

  return { user, company: membership.company, role: membership.role };
}
