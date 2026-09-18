import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";

export class EvaluationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function stripCodeFence(text: string) {
  return text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

interface RawEvaluation {
  score: number;
  summary: string;
  cvMatchNotes: string;
  levelStrategy: string;
  compNotes: string;
  personalization: string;
  interviewPrep: string;
  legitimacy: "CLEAR" | "CAUTION" | "LIKELY_SCAM";
  legitimacyNotes: string;
  sponsorshipBlocker: boolean;
}

const SYSTEM_PROMPT = `You are a career strategist producing a holistic, honest evaluation of one job posting for one candidate.
Ground every claim only in the CareerContext and job description given — never invent facts about the candidate or the employer.
Reach the score by holistic judgement across fit dimensions, not an arithmetic formula. Be willing to score low (even 1-2) when the fit is genuinely poor — false encouragement wastes the candidate's time.
Flag legitimacy honestly: LIKELY_SCAM for postings with classic scam signals (payment requested, "urgent hiring" with no real company presence, generic personal-email contact, unrealistic pay for vague responsibilities), CAUTION for vague/red-flag-ish but not clearly fraudulent, CLEAR otherwise. Set sponsorshipBlocker true only if the posting explicitly states no visa sponsorship AND the candidate's CareerContext says they need it.
Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"score": <integer 10-50, one decimal of a 1-5 score times 10, e.g. 4.5 stars = 45>, "summary": "<2-3 sentence role summary>", "cvMatchNotes": "<2-4 sentences on how the candidate's real background matches or doesn't>", "levelStrategy": "<1-2 sentences on whether to apply at this level, aim higher, or negotiate title>", "compNotes": "<1-2 sentences on compensation fit, using the candidate's stated range and the posting's, if either is known>", "personalization": "<1-2 sentences the candidate could use to personalize an application>", "interviewPrep": "<2-3 sentences on what this interview will likely probe>", "legitimacy": "CLEAR|CAUTION|LIKELY_SCAM", "legitimacyNotes": "<1 sentence, empty string if CLEAR and nothing notable>", "sponsorshipBlocker": <boolean>}`;

async function loadJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job || job.deletedAt) throw new EvaluationError("This job could not be found.", "NOT_FOUND");
  return job;
}

export async function getEvaluation(profileId: string, jobId: string) {
  return prisma.jobEvaluation.findUnique({ where: { profileId_jobId: { profileId, jobId } } });
}

export async function evaluateJob(userId: string, profileId: string, jobId: string) {
  const job = await loadJob(jobId);
  const careerContext = await buildCareerContext(userId);
  const jobContext = `Title: ${job.title}\nCompany: ${job.company.name}\nLocation: ${job.location ?? "unspecified"}\nWorkplace: ${job.workplaceType}\nSalary: ${job.salaryMin ?? "?"}-${job.salaryMax ?? "?"} ${job.salaryCurrency}\nDescription:\n${job.description.slice(0, 6000)}`;

  const { text, provider } = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `CareerContext:\n${careerContext}\n\nJob posting:\n${jobContext}\n\nEvaluate this posting.`,
    maxTokens: 1200,
  });

  let parsed: RawEvaluation;
  if (provider === "mock") {
    parsed = {
      score: 30,
      summary: "[DEV MODE — no AI provider configured. Set an AI provider key for a real evaluation.]",
      cvMatchNotes: "Configure a real AI provider to get genuine analysis.",
      levelStrategy: "",
      compNotes: "",
      personalization: "",
      interviewPrep: "",
      legitimacy: "CLEAR",
      legitimacyNotes: "",
      sponsorshipBlocker: false,
    };
  } else {
    try {
      parsed = JSON.parse(stripCodeFence(text)) as RawEvaluation;
      if (!parsed?.summary) throw new Error("empty");
    } catch {
      throw new EvaluationError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
    }
  }

  const score = Math.max(10, Math.min(50, Math.round(parsed.score)));

  return prisma.jobEvaluation.upsert({
    where: { profileId_jobId: { profileId, jobId } },
    create: {
      profileId,
      jobId,
      score,
      summary: parsed.summary,
      cvMatchNotes: parsed.cvMatchNotes ?? "",
      levelStrategy: parsed.levelStrategy ?? "",
      compNotes: parsed.compNotes ?? "",
      personalization: parsed.personalization ?? "",
      interviewPrep: parsed.interviewPrep ?? "",
      legitimacy: parsed.legitimacy ?? "CLEAR",
      legitimacyNotes: parsed.legitimacyNotes ?? "",
      sponsorshipBlocker: Boolean(parsed.sponsorshipBlocker),
    },
    update: {
      score,
      summary: parsed.summary,
      cvMatchNotes: parsed.cvMatchNotes ?? "",
      levelStrategy: parsed.levelStrategy ?? "",
      compNotes: parsed.compNotes ?? "",
      personalization: parsed.personalization ?? "",
      interviewPrep: parsed.interviewPrep ?? "",
      legitimacy: parsed.legitimacy ?? "CLEAR",
      legitimacyNotes: parsed.legitimacyNotes ?? "",
      sponsorshipBlocker: Boolean(parsed.sponsorshipBlocker),
    },
  });
}
