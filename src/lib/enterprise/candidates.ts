import "server-only";
import { prisma } from "@/lib/prisma";
import { computeMatch } from "@/lib/matching/engine";
import { toProfileInput, toJobInput, getJobForMatching } from "@/lib/matching/service";
import { visibilityFilter } from "@/lib/employer/talent";
import { candidateResumePdf, candidateResumeDocument, resumePlainText } from "@/lib/resume/candidate-document";
import type { Prisma } from "@prisma/client";
import { EnterpriseError, consumeCredit, requireFeature, type RecruiterContext } from "./account";

/**
 * Resume fetching. Search and preview are free and show only what a
 * candidate's visibility setting already exposes to recruiters; the full
 * package (name, contact details, resume) costs one resume credit, charged
 * once per candidate per firm. Candidates who applied to the firm already
 * shared their resume with it, so those are never charged.
 *
 * Only candidates who chose PUBLIC or RECRUITERS_ONLY visibility (or who
 * applied to this firm) are ever returned — candidate privacy settings are
 * respected, never widened.
 */

export interface CandidateSearchFilters {
  q?: string;
  location?: string;
  maxSalary?: number;
  minYears?: number;
  maxYears?: number;
  skills?: string[];
  industry?: string;
  education?: string;
  employer?: string;
  careerLevel?: string;
  jobId?: string;
  page?: number;
}

const PAGE_SIZE = 25;

function searchWhere(companyId: string, f: CandidateSearchFilters): Prisma.CandidateProfileWhereInput {
  const and: Prisma.CandidateProfileWhereInput[] = [visibilityFilter(companyId)];
  if (f.q) {
    and.push({
      OR: [
        { currentTitle: { contains: f.q, mode: "insensitive" } },
        { headline: { contains: f.q, mode: "insensitive" } },
        { desiredTitles: { has: f.q } },
        { experiences: { some: { title: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.location) {
    and.push({
      OR: [
        { location: { contains: f.location, mode: "insensitive" } },
        { desiredLocations: { has: f.location } },
      ],
    });
  }
  // A candidate fits a budget when the least they'd accept is within it.
  if (f.maxSalary) and.push({ OR: [{ desiredSalaryMin: null }, { desiredSalaryMin: { lte: f.maxSalary } }] });
  if (f.minYears != null) and.push({ totalExperienceYears: { gte: f.minYears } });
  if (f.maxYears != null) and.push({ totalExperienceYears: { lte: f.maxYears } });
  if (f.skills?.length) {
    for (const skill of f.skills) {
      and.push({ skills: { some: { skill: { name: { equals: skill, mode: "insensitive" } } } } });
    }
  }
  if (f.industry) and.push({ industry: { contains: f.industry, mode: "insensitive" } });
  if (f.education) {
    and.push({
      education: {
        some: {
          OR: [
            { degree: { contains: f.education, mode: "insensitive" } },
            { fieldOfStudy: { contains: f.education, mode: "insensitive" } },
            { school: { contains: f.education, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  if (f.employer) {
    and.push({
      OR: [
        { currentCompany: { contains: f.employer, mode: "insensitive" } },
        { experiences: { some: { company: { contains: f.employer, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.careerLevel) and.push({ careerLevel: f.careerLevel as never });
  return { onboardingCompletedAt: { not: null }, user: { deletedAt: null, status: "ACTIVE" }, AND: and };
}

/** Profile ids this firm may see in full without spending a credit. */
async function freeAccessIds(ctx: RecruiterContext, profileIds: string[]) {
  if (!profileIds.length) return { unlocked: new Set<string>(), applied: new Set<string>() };
  const [unlocks, applications] = await Promise.all([
    ctx.state.account
      ? prisma.resumeUnlock.findMany({
          where: { accountId: ctx.state.account.id, candidateProfileId: { in: profileIds } },
          select: { candidateProfileId: true },
        })
      : [],
    prisma.application.findMany({
      where: { profileId: { in: profileIds }, job: { companyId: ctx.company.id } },
      select: { profileId: true },
    }),
  ]);
  return {
    unlocked: new Set(unlocks.map((u) => u.candidateProfileId)),
    applied: new Set(applications.map((a) => a.profileId)),
  };
}

export async function searchCandidates(ctx: RecruiterContext, filters: CandidateSearchFilters) {
  requireFeature(ctx.state, "resumeFetching", "Resume fetching");
  const where = searchWhere(ctx.company.id, filters);
  const page = Math.max(1, filters.page ?? 1);

  const [profiles, total] = await Promise.all([
    prisma.candidateProfile.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        skills: { include: { skill: true }, take: 15 },
        education: { orderBy: { endDate: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.candidateProfile.count({ where }),
  ]);

  let job: Awaited<ReturnType<typeof getJobForMatching>> | null = null;
  if (filters.jobId) {
    job = await getJobForMatching(filters.jobId).catch(() => null);
    if (job && job.companyId !== ctx.company.id) job = null;
  }
  const access = await freeAccessIds(ctx, profiles.map((p) => p.id));

  const results = profiles.map((p) => {
    const full = access.unlocked.has(p.id) || access.applied.has(p.id);
    return {
      profileId: p.id,
      // Until unlocked, a preview shows a first name and last initial only.
      displayName: full ? `${p.user.firstName} ${p.user.lastName}` : `${p.user.firstName} ${p.user.lastName.slice(0, 1)}.`,
      headline: p.headline,
      currentTitle: p.currentTitle,
      currentCompany: p.currentCompany,
      location: p.location,
      industry: p.industry,
      careerLevel: p.careerLevel,
      totalExperienceYears: p.totalExperienceYears,
      desiredSalaryMin: p.desiredSalaryMin,
      desiredSalaryMax: p.desiredSalaryMax,
      salaryCurrency: p.salaryCurrency,
      education: p.education[0] ? [p.education[0].degree, p.education[0].fieldOfStudy, p.education[0].school].filter(Boolean).join(", ") : null,
      skills: p.skills.map((s) => s.skill.name),
      matchScore: job ? computeMatch(toProfileInput(p), toJobInput(job)).score : null,
      unlocked: access.unlocked.has(p.id),
      applied: access.applied.has(p.id),
    };
  });
  if (job) results.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  return { results, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Throws unless this firm may see this candidate at all. */
async function discoverableProfile(ctx: RecruiterContext, profileId: string) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { id: profileId, onboardingCompletedAt: { not: null }, user: { deletedAt: null, status: "ACTIVE" }, ...visibilityFilter(ctx.company.id) },
    include: { user: true },
  });
  if (!profile) throw new EnterpriseError("This candidate isn't available.", "NOT_FOUND");
  return profile;
}

export async function hasFullAccess(ctx: RecruiterContext, profileId: string) {
  const access = await freeAccessIds(ctx, [profileId]);
  return access.unlocked.has(profileId) || access.applied.has(profileId);
}

/**
 * Unlocks a candidate's package for one resume credit. Idempotent: a
 * second unlock (double click, retry, or a teammate) costs nothing.
 */
export async function unlockCandidate(ctx: RecruiterContext, profileId: string) {
  requireFeature(ctx.state, "resumeFetching", "Resume fetching");
  await discoverableProfile(ctx, profileId);
  if (await hasFullAccess(ctx, profileId)) return { charged: false };

  const { charged } = await consumeCredit(
    ctx.state,
    "RESUME_FETCH",
    `unlock:${profileId}`,
    { actorUserId: ctx.user.id, candidateProfileId: profileId, note: "Resume unlock" },
    (tx) =>
      tx.resumeUnlock.upsert({
        where: {
          accountId_candidateProfileId_periodKey: {
            accountId: ctx.state.account!.id,
            candidateProfileId: profileId,
            periodKey: ctx.state.periodKey!,
          },
        },
        create: { accountId: ctx.state.account!.id, candidateProfileId: profileId, periodKey: ctx.state.periodKey!, unlockedById: ctx.user.id },
        update: {},
      })
  );
  return { charged };
}

/** The full package — only after unlock (or if they applied to this firm). */
export async function candidatePackage(ctx: RecruiterContext, profileId: string) {
  requireFeature(ctx.state, "resumeFetching", "Resume fetching");
  const profile = await discoverableProfile(ctx, profileId);
  if (!(await hasFullAccess(ctx, profileId))) {
    throw new EnterpriseError("Unlock this candidate to see their contact details and resume.", "LOCKED");
  }
  const { doc, source } = await candidateResumeDocument(profile.user, profile.id, profile.location);
  return {
    profileId: profile.id,
    userId: profile.user.id,
    name: `${profile.user.firstName} ${profile.user.lastName}`,
    email: profile.user.email,
    phone: profile.user.phone,
    location: profile.location,
    headline: profile.headline,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    resume: doc,
    resumeText: resumePlainText(doc),
    resumeSource: source,
  };
}

export async function candidateResumeFile(ctx: RecruiterContext, profileId: string) {
  requireFeature(ctx.state, "resumeFetching", "Resume fetching");
  const profile = await discoverableProfile(ctx, profileId);
  if (!(await hasFullAccess(ctx, profileId))) {
    throw new EnterpriseError("Unlock this candidate to download their resume.", "LOCKED");
  }
  return candidateResumePdf(profile.user, profile.id, profile.location);
}

export { discoverableProfile };
