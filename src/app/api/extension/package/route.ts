import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { findOrCreateExternalCompany } from "@/lib/company/service";
import { findOrCreateExternalJob } from "@/lib/autoapply/service";
import { generateCoverLetter } from "@/lib/resume/cover-letter";
import { improveResumeSummary } from "@/lib/resume/ai";
import { extensionPackageRequestSchema } from "@/lib/validations/autoapply";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitForTier } from "@/lib/billing/priority";
import { extCatch, extOk } from "@/lib/extension/response";

/**
 * Real tailored application packages: a resume-summary override and cover
 * letter written for one specific posting, generated once and cached on the
 * Application row so a re-visited or retried posting doesn't re-spend AI
 * calls. Gated behind Cover Letter Studio — an unentitled user still gets a
 * working fill, just from the base profile rather than a tailored one.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);
    if (!entitlements.coverLetterStudio) {
      return extOk({ tailored: false });
    }

    const { limit: perMinute } = rateLimitForTier(entitlements.aiPriorityTier);
    const limit = rateLimit(`extension-package:${user.id}`, perMinute, 60 * 1000);
    if (!limit.allowed) return extOk({ tailored: false });

    const input = extensionPackageRequestSchema.parse(await req.json());

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      include: { skills: { include: { skill: true }, take: 8 } },
    });
    if (!candidateProfile) return extOk({ tailored: false });

    const company = await findOrCreateExternalCompany(input.company || "Unknown Company");
    const job = await findOrCreateExternalJob(company.id, {
      url: input.jobUrl,
      title: input.title,
      ats: input.ats,
      description: input.description || undefined,
    });

    const jobTitle = input.title || job.title;
    const jobDescription = input.description || job.description;

    const existing = await prisma.application.findUnique({
      where: { profileId_jobId: { profileId: candidateProfile.id, jobId: job.id } },
    });
    if (existing?.coverLetter) {
      const answers = (existing.answers as { tailoredSummary?: string } | null) ?? {};
      return extOk({
        tailored: true,
        applicationId: existing.id,
        coverLetter: existing.coverLetter,
        resume: { narrative: { summary: answers.tailoredSummary || "" } },
        screeningAnswers: [],
      });
    }

    const [coverLetterResult, summaryResult] = await Promise.all([
      generateCoverLetter({
        userId: user.id,
        jobTitle,
        companyName: company.name,
        jobDescription,
        tone: "professional",
        executiveMode: entitlements.executiveMode,
      }),
      improveResumeSummary({
        currentSummary: candidateProfile.bio ?? undefined,
        headline: candidateProfile.headline ?? undefined,
        currentTitle: candidateProfile.currentTitle ?? undefined,
        topSkills: candidateProfile.skills.map((s) => s.skill.name),
        jobDescription,
        executiveMode: entitlements.executiveMode,
      }),
    ]);

    const application = await prisma.application.upsert({
      where: { profileId_jobId: { profileId: candidateProfile.id, jobId: job.id } },
      update: {
        coverLetter: coverLetterResult.text,
        answers: { tailoredSummary: summaryResult.text },
      },
      create: {
        profileId: candidateProfile.id,
        jobId: job.id,
        status: "SAVED",
        source: "EXTENSION",
        coverLetter: coverLetterResult.text,
        answers: { tailoredSummary: summaryResult.text },
      },
    });

    return extOk({
      tailored: true,
      applicationId: application.id,
      coverLetter: coverLetterResult.text,
      resume: { narrative: { summary: summaryResult.text } },
      screeningAnswers: [],
    });
  } catch (error) {
    return extCatch(error);
  }
}
