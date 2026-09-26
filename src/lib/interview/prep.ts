import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";
import { InterviewError } from "@/lib/interview/service";
import type { Prisma } from "@prisma/client";

/**
 * "Prepare" — the auto-generated prep pack for one job application, built
 * once (the moment the application reaches INTERVIEW status — see
 * updateApplicationStatusForCompany in src/lib/employer/applications.ts) and
 * reused everywhere else (Practice, the Applications page) rather than
 * regenerated on every view.
 */

const PREP_QUESTION_COUNT = 6;
const PREP_STORY_COUNT = 6;
const ASK_QUESTION_COUNT = 4;

export interface PrepQuestion {
  category: string;
  question: string;
}

export interface PrepStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface GeneratedPrepContent {
  companyBrief: string;
  questions: PrepQuestion[];
  stories: PrepStory[];
  questionsToAsk: string[];
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

function mockPrepContent(jobTitle: string, companyName: string): GeneratedPrepContent {
  return {
    companyBrief: `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY for a real company brief.] ${companyName} is hiring for ${jobTitle}.`,
    questions: Array.from({ length: PREP_QUESTION_COUNT }, (_, i) => ({
      category: i % 2 === 0 ? "Behavioral" : "Role-specific",
      question: `[DEV MODE] Placeholder interview question ${i + 1} for ${jobTitle}.`,
    })),
    stories: Array.from({ length: PREP_STORY_COUNT }, (_, i) => ({
      title: `[DEV MODE] Placeholder story ${i + 1}`,
      situation: "Configure a real AI provider to generate STAR stories grounded in your actual history.",
      task: "",
      action: "",
      result: "",
    })),
    questionsToAsk: Array.from({ length: ASK_QUESTION_COUNT }, (_, i) => `[DEV MODE] Placeholder question to ask #${i + 1}`),
  };
}

async function generatePrepContent(
  careerContext: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  companyDescription: string | null
): Promise<GeneratedPrepContent> {
  const system = `You are an expert interview coach building a "prep pack" for a candidate who has just been invited to interview for a specific role.
Ground everything ONLY in the CareerContext (the candidate's real background) and the job/company details given below — never invent experience, employers, metrics, or facts the candidate's history doesn't support, and never invent facts about the company beyond what is given.

Produce exactly:
1. A short company brief (2-4 sentences, based only on the company info given — if little is given, keep it brief and honest rather than inventing detail).
2. ${PREP_QUESTION_COUNT} likely interview questions for this role, mixing behavioral and role-specific/technical.
3. ${PREP_STORY_COUNT} STAR-format stories (situation, task, action, result) pulled from the candidate's ACTUAL experience in CareerContext — each grounded in something they actually did. If the candidate's history doesn't support ${PREP_STORY_COUNT} distinct stories, return fewer rather than inventing any.
4. ${ASK_QUESTION_COUNT} good questions the candidate could ask the interviewer about this specific role/company.

Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"companyBrief": "string", "questions": [{"category": "string", "question": "string"}, ...], "stories": [{"title": "string", "situation": "string", "task": "string", "action": "string", "result": "string"}, ...], "questionsToAsk": ["string", ...]}`;

  const prompt = `CareerContext for this candidate:\n${careerContext}\n\nRole: ${jobTitle} at ${companyName}\n\nJob description:\n${jobDescription.slice(0, 2500)}\n\nCompany info:\n${companyDescription ?? "No further company info on file."}`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 2200 });
  if (provider === "mock") return mockPrepContent(jobTitle, companyName);

  try {
    const parsed = JSON.parse(stripCodeFence(text)) as GeneratedPrepContent;
    if (!parsed?.companyBrief || !Array.isArray(parsed.questions) || !Array.isArray(parsed.stories)) {
      throw new Error("malformed prep pack response");
    }
    return {
      companyBrief: parsed.companyBrief,
      questions: parsed.questions.slice(0, PREP_QUESTION_COUNT),
      stories: parsed.stories.slice(0, PREP_STORY_COUNT),
      questionsToAsk: (parsed.questionsToAsk ?? []).slice(0, ASK_QUESTION_COUNT),
    };
  } catch {
    throw new InterviewError("The AI provider returned an unexpected response building the prep pack.", "AI_PARSE_ERROR");
  }
}

/**
 * Generates (or returns the existing) prep pack for one application. Safe to
 * call more than once — it never regenerates once a pack exists for that
 * applicationId, per the "generated once and reused" requirement.
 */
export async function ensurePrepPack(applicationId: string) {
  const existing = await prisma.interviewPrepPack.findUnique({ where: { applicationId } });
  if (existing) return existing;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { company: true } }, profile: { include: { user: true } } },
  });
  if (!application) throw new InterviewError("This application could not be found.", "NOT_FOUND");

  const careerContext = await buildCareerContext(application.profile.userId);
  const content = await generatePrepContent(
    careerContext,
    application.job.title,
    application.job.company.name,
    application.job.description,
    application.job.company.description
  );

  return prisma.interviewPrepPack.create({
    data: {
      applicationId: application.id,
      profileId: application.profileId,
      jobId: application.jobId,
      companyBrief: content.companyBrief,
      questions: content.questions as unknown as Prisma.InputJsonValue,
      stories: content.stories as unknown as Prisma.InputJsonValue,
      questionsToAsk: content.questionsToAsk,
    },
  });
}

/**
 * Fire-and-forget trigger for the INTERVIEW status transition — never lets a
 * prep pack failure block the employer's own status update.
 */
export function triggerPrepPackGeneration(applicationId: string) {
  ensurePrepPack(applicationId).catch((error) => {
    console.error(`Failed to generate interview prep pack for application ${applicationId}:`, error);
  });
}

/** Lists this candidate's prep packs, most recent first — used by the
    interview-extension's Live Copilot to let the person pick which job's
    interview they're in, so hints ground in the right prep pack. */
export async function listPrepPacksForProfile(profileId: string) {
  return prisma.interviewPrepPack.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true, company: { select: { name: true } } } } },
  });
}

export async function getPrepPackForApplication(profileId: string, applicationId: string) {
  const application = await prisma.application.findFirst({ where: { id: applicationId, profileId } });
  if (!application) throw new InterviewError("This application could not be found.", "NOT_FOUND");
  return ensurePrepPack(applicationId);
}

/**
 * Weights more recent scores more heavily (most-recent-first input), so
 * readiness climbs as practice accumulates rather than averaging flatly
 * across every attempt ever made. Pure and exported for unit testing.
 */
export function computeWeightedReadiness(scoresNewestFirst: number[]): number {
  if (scoresNewestFirst.length === 0) return 0;
  const weights = scoresNewestFirst.map((_, i) => scoresNewestFirst.length - i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = scoresNewestFirst.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
  return Math.round(weighted);
}

/**
 * Per-job readiness score — distinct from CandidateProfile.interviewScore
 * (account-wide). Recomputed after each completed practice session tied to
 * this job, from performance against that job's own prep pack.
 */
export async function recomputeJobReadiness(profileId: string, jobId: string) {
  const prepPack = await prisma.interviewPrepPack.findFirst({ where: { profileId, jobId } });
  if (!prepPack) return null;

  const sessions = await prisma.interviewSession.findMany({
    where: { profileId, jobId, status: "COMPLETED", overallScore: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { overallScore: true },
  });
  if (sessions.length === 0) return prepPack;

  const readinessScore = computeWeightedReadiness(sessions.map((s) => s.overallScore ?? 0));

  return prisma.interviewPrepPack.update({
    where: { id: prepPack.id },
    data: { readinessScore, readinessUpdatedAt: new Date() },
  });
}
