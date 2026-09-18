import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";

export class NegotiationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const NEGOTIATION_SCENARIOS = [
  "counter-offer",
  "competing-offer",
  "geographic-discount-pushback",
  "asking-for-more-time",
] as const;
export type NegotiationScenario = (typeof NEGOTIATION_SCENARIOS)[number];

const SCENARIO_LABEL: Record<NegotiationScenario, string> = {
  "counter-offer": "responding to an initial offer with a counter",
  "competing-offer": "using a competing offer as leverage",
  "geographic-discount-pushback": "pushing back on a location-based pay discount",
  "asking-for-more-time": "asking for more time to decide without losing the offer",
};

const SYSTEM_PROMPT = `You write a real, ready-to-use salary negotiation script for one candidate.
Ground it only in the real numbers and facts given — the candidate's desired range, the job's posted range (if known), and the offer on the table (if known). Never invent a number.
Write it as something the candidate could say nearly verbatim on a call or send as an email — natural, confident, not aggressive, no filler. Include the actual numbers where they're known.
Return plain text only, no markdown, no headings — just the script, 120-220 words.`;

export async function listScripts(profileId: string) {
  return prisma.negotiationScript.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true, company: { select: { name: true } } } } },
  });
}

export async function generateScript(
  userId: string,
  profileId: string,
  input: { scenario: NegotiationScenario; jobId?: string; offeredSalary?: number; currency?: string }
) {
  const careerContext = await buildCareerContext(userId);

  let jobLine = "No specific job attached.";
  let validJobId: string | undefined;
  if (input.jobId) {
    const job = await prisma.job.findUnique({ where: { id: input.jobId }, include: { company: true } });
    if (job) {
      validJobId = job.id;
      jobLine = `Role: ${job.title} at ${job.company.name}. Posted range: ${job.salaryMin ?? "unstated"}-${job.salaryMax ?? "unstated"} ${job.salaryCurrency}.`;
    }
  }

  const currency = input.currency || "USD";
  const offerLine = input.offeredSalary ? `Offer on the table: ${input.offeredSalary} ${currency}.` : "No specific offer amount given.";

  const prompt = `CareerContext:\n${careerContext}\n\nScenario: ${SCENARIO_LABEL[input.scenario]}\n${jobLine}\n${offerLine}\n\nWrite the script.`;

  const { text, provider } = await generateText({ system: SYSTEM_PROMPT, prompt, maxTokens: 500 });
  const script =
    provider === "mock"
      ? "[DEV MODE — no AI provider configured. Set an AI provider key for a real negotiation script.]"
      : text.trim();

  return prisma.negotiationScript.create({
    data: {
      profileId,
      jobId: validJobId,
      scenario: input.scenario,
      offeredSalary: input.offeredSalary ?? null,
      currency,
      script,
    },
    include: { job: { select: { title: true, company: { select: { name: true } } } } },
  });
}

export interface SalaryGap {
  desiredMin: number | null;
  desiredMax: number | null;
  advertisedMin: number | null;
  advertisedMax: number | null;
  offered: number | null;
  offeredVsDesiredPercent: number | null;
}

export async function computeSalaryGap(profileId: string, jobId: string | undefined, offered: number | undefined): Promise<SalaryGap> {
  const profile = await prisma.candidateProfile.findUniqueOrThrow({ where: { id: profileId } });
  let advertisedMin: number | null = null;
  let advertisedMax: number | null = null;
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    advertisedMin = job?.salaryMin ?? null;
    advertisedMax = job?.salaryMax ?? null;
  }

  const desiredMid = profile.desiredSalaryMin != null && profile.desiredSalaryMax != null
    ? (profile.desiredSalaryMin + profile.desiredSalaryMax) / 2
    : profile.desiredSalaryMin ?? profile.desiredSalaryMax ?? null;

  return {
    desiredMin: profile.desiredSalaryMin,
    desiredMax: profile.desiredSalaryMax,
    advertisedMin,
    advertisedMax,
    offered: offered ?? null,
    offeredVsDesiredPercent:
      offered != null && desiredMid != null && desiredMid > 0 ? Math.round(((offered - desiredMid) / desiredMid) * 100) : null,
  };
}
