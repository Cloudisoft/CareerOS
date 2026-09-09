import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import type { InterviewType } from "@prisma/client";

export class InterviewError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const QUESTIONS_PER_SESSION = 5;

const TYPE_LABEL: Record<InterviewType, string> = {
  BEHAVIORAL: "behavioral (STAR-style: situation, task, action, result)",
  TECHNICAL: "role-specific technical and problem-solving",
  MIXED: "a mix of behavioral and role-specific technical",
};

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

interface GeneratedQuestion {
  category: string;
  question: string;
}

function mockQuestions(type: InterviewType): GeneratedQuestion[] {
  const label = TYPE_LABEL[type];
  return Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => ({
    category: "Dev mode",
    question: `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY for real, tailored ${label} questions.] Placeholder question ${i + 1} of ${QUESTIONS_PER_SESSION}.`,
  }));
}

async function generateQuestions(
  type: InterviewType,
  careerContext: string,
  jobContext: string | null
): Promise<GeneratedQuestion[]> {
  const system = `You are an expert interviewer creating a mock interview for a candidate practicing on Career OS.
Generate realistic, specific interview questions grounded only in the candidate's real background given below and, if provided, the target job. Never invent facts about the candidate that aren't in their CareerContext.
Respond with ONLY a JSON array, no markdown code fences, no prose, in exactly this shape:
[{"category": "string", "question": "string"}, ...]`;

  const prompt = `Generate exactly ${QUESTIONS_PER_SESSION} ${TYPE_LABEL[type]} interview questions for this candidate.

CareerContext:
${careerContext}
${jobContext ? `\nTarget job:\n${jobContext}` : ""}`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 1200 });
  if (provider === "mock") return mockQuestions(type);

  try {
    const parsed = JSON.parse(stripCodeFence(text)) as GeneratedQuestion[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
    return parsed.slice(0, QUESTIONS_PER_SESSION);
  } catch {
    throw new InterviewError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
  }
}

interface AnswerScore {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

function mockScore(answer: string): AnswerScore {
  return {
    score: Math.min(70, 30 + Math.round(answer.length / 20)),
    feedback:
      "[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY for real scoring.] This is a length-based placeholder score, not real interview feedback.",
    strengths: ["Answer submitted"],
    improvements: ["Configure a real AI provider to get genuine feedback"],
  };
}

async function scoreAnswer(question: string, category: string, answer: string): Promise<AnswerScore> {
  const system = `You are an expert interview coach scoring one candidate's written answer to a mock interview question.
Score honestly on structure (e.g. STAR for behavioral questions), specificity, relevance, and clarity. Do not invent facts about the candidate beyond what they wrote; do not be falsely encouraging.
Respond with ONLY JSON, no markdown code fences, no prose, in exactly this shape:
{"score": <integer 0-100>, "feedback": "<2-3 sentences>", "strengths": ["<short item>", ...up to 3], "improvements": ["<short item>", ...up to 3]}`;

  const prompt = `Question (${category}): ${question}\n\nCandidate's answer:\n${answer}\n\nScore this answer.`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 500 });
  if (provider === "mock") return mockScore(answer);

  try {
    const parsed = JSON.parse(stripCodeFence(text)) as AnswerScore;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      feedback: parsed.feedback,
      strengths: parsed.strengths?.slice(0, 3) ?? [],
      improvements: parsed.improvements?.slice(0, 3) ?? [],
    };
  } catch {
    throw new InterviewError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
  }
}

export async function listSessions(profileId: string) {
  return prisma.interviewSession.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true, company: { select: { name: true } } } }, _count: { select: { questions: true } } },
  });
}

export async function getSession(profileId: string, sessionId: string) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, profileId },
    include: {
      questions: { orderBy: { order: "asc" } },
      job: { select: { title: true, company: { select: { name: true } } } },
    },
  });
  if (!session) throw new InterviewError("This interview session could not be found.", "NOT_FOUND");
  return session;
}

export async function startSession(userId: string, profileId: string, type: InterviewType, jobId?: string) {
  let jobContext: string | null = null;
  let validJobId: string | undefined;

  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
    if (job) {
      validJobId = job.id;
      jobContext = `${job.title} at ${job.company.name}\n${job.description.slice(0, 1500)}`;
    }
  }

  const careerContext = await buildCareerContext(userId);
  const questions = await generateQuestions(type, careerContext, jobContext);

  return prisma.interviewSession.create({
    data: {
      profileId,
      jobId: validJobId,
      type,
      questions: {
        create: questions.map((q, i) => ({ order: i, category: q.category, question: q.question })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function submitAnswer(profileId: string, sessionId: string, questionId: string, answer: string) {
  const session = await getSession(profileId, sessionId);
  if (session.status !== "IN_PROGRESS") {
    throw new InterviewError("This session has already been completed.", "SESSION_COMPLETED");
  }
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new InterviewError("This question could not be found.", "NOT_FOUND");

  const result = await scoreAnswer(question.question, question.category, answer);

  return prisma.interviewQuestion.update({
    where: { id: questionId },
    data: {
      answer,
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      answeredAt: new Date(),
    },
  });
}

export async function completeSession(profileId: string, sessionId: string) {
  const session = await getSession(profileId, sessionId);
  if (session.status === "COMPLETED") return session;

  const scored = session.questions.filter((q) => q.score != null);
  const overallScore = scored.length
    ? Math.round(scored.reduce((sum, q) => sum + (q.score ?? 0), 0) / scored.length)
    : null;

  const updated = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date(), overallScore },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const recent = await prisma.interviewSession.findMany({
    where: { profileId, status: "COMPLETED", overallScore: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { overallScore: true },
  });
  const interviewScore = recent.length
    ? Math.round(recent.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / recent.length)
    : 0;

  await prisma.candidateProfile.update({ where: { id: profileId }, data: { interviewScore } });
  await recomputeCareerReadiness(profileId);

  return updated;
}
