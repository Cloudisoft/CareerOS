import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/resume/cover-letter";
import { generateCoverLetterSchema } from "@/lib/validations/resume";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    const entitlements = await requireEntitlement(user.id, "coverLetterStudio");
    const input = generateCoverLetterSchema.parse(await req.json());

    let jobTitle = input.jobTitle;
    let companyName = input.companyName;
    let jobDescription = input.jobDescription;

    if (input.jobId) {
      const job = await prisma.job.findUnique({ where: { id: input.jobId }, include: { company: true } });
      if (!job) return apiError("This job could not be found.", 404, "NOT_FOUND");
      jobTitle = job.title;
      companyName = job.company.name;
      jobDescription = job.description;
    }

    if (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()) {
      return apiError("Title, company, and job description are required.", 422, "VALIDATION_ERROR");
    }

    const result = await generateCoverLetter({
      userId: user.id,
      jobTitle,
      companyName,
      jobDescription,
      tone: input.tone,
      executiveMode: entitlements.executiveMode,
    });

    await prisma.aiUsage.create({ data: { userId: user.id, feature: "cover_letter_studio", provider: result.provider } });

    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
