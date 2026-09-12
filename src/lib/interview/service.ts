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

export const QUESTIONS_PER_SESSION = 5;

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

function mockQuestion(type: InterviewType, questionNumber: number): GeneratedQuestion {
  const label = TYPE_LABEL[type];
  return {
    category: "Dev mode",
    question: `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY for real, tailored ${label} questions.] Placeholder question ${questionNumber} of ${QUESTIONS_PER_SESSION}.`,
  };
}

interface AnsweredTurn {
  category: string;
  question: string;
  answer: string;
}

/**
 * Generates ONE question at a time, live — question 1 opens the interview;
 * every question after that is generated only once the candidate has
 * answered the previous one, reading their actual answer and deciding
 * whether to probe deeper on it or move to new ground, the way a real
 * interviewer conducts a conversation rather than reading a fixed script.
 */
async function generateQuestion(
  type: InterviewType,
  careerContext: string,
  jobContext: string | null,
  history: AnsweredTurn[],
  questionNumber: number
): Promise<GeneratedQuestion> {
  const label = TYPE_LABEL[type];
  const system = `You are an expert interviewer conducting a live ${label} mock interview with a candidate, one question at a time — this is question ${questionNumber} of ${QUESTIONS_PER_SESSION}.
Ground every question only in the candidate's real background (CareerContext) below and, if given, the target job — never invent facts about them.
${
  history.length > 0
    ? "You have already asked the questions below and the candidate answered each. Read their most recent answer closely: if it left something specific worth probing — a vague claim, an interesting detail, a result stated without a number, a decision they glossed over — ask a genuine, natural follow-up question about exactly that. Otherwise, move on to a new angle you haven't covered yet. Don't repeat ground already covered."
    : "This is the opening question of the interview — set a natural, welcoming tone."
}
Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"category": "string", "question": "string"}`;

  const historyBlock = history.length
    ? `\n\nQuestions asked so far and the candidate's answers, in order:\n${history
        .map((h, i) => `${i + 1}. [${h.category}] ${h.question}\nCandidate's answer: ${h.answer}`)
        .join("\n\n")}`
    : "";

  const prompt = `CareerContext:\n${careerContext}${jobContext ? `\n\nTarget job:\n${jobContext}` : ""}${historyBlock}\n\nAsk question ${questionNumber} of ${QUESTIONS_PER_SESSION} now.`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 400 });
  if (provider === "mock") return mockQuestion(type, questionNumber);

  try {
    const parsed = JSON.parse(stripCodeFence(text)) as GeneratedQuestion;
    if (!parsed?.question) throw new Error("empty");
    return parsed;
  } catch {
    throw new InterviewError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
  }
}

async function loadJobContext(jobId?: string | null): Promise<{ context: string | null; validId: string | undefined }> {
  if (!jobId) return { context: null, validId: undefined };
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) return { context: null, validId: undefined };
  return { context: `${job.title} at ${job.company.name}\n${job.description.slice(0, 1500)}`, validId: job.id };
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

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function countSessionsThisMonth(profileId: string) {
  return prisma.interviewSession.count({ where: { profileId, createdAt: { gte: startOfMonthUtc() } } });
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
  const { context: jobContext, validId: validJobId } = await loadJobContext(jobId);
  const careerContext = await buildCareerContext(userId);
  const first = await generateQuestion(type, careerContext, jobContext, [], 1);

  return prisma.interviewSession.create({
    data: {
      profileId,
      jobId: validJobId,
      type,
      questions: { create: [{ order: 0, category: first.category, question: first.question }] },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function submitAnswer(userId: string, profileId: string, sessionId: string, questionId: string, answer: string) {
  const session = await getSession(profileId, sessionId);
  if (session.status !== "IN_PROGRESS") {
    throw new InterviewError("This session has already been completed.", "SESSION_COMPLETED");
  }
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new InterviewError("This question could not be found.", "NOT_FOUND");

  const result = await scoreAnswer(question.question, question.category, answer);

  const updated = await prisma.interviewQuestion.update({
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

  const nextOrder = question.order + 1;
  if (nextOrder < QUESTIONS_PER_SESSION) {
    const history: AnsweredTurn[] = [
      ...session.questions
        .filter((q) => q.answer != null)
        .map((q) => ({ category: q.category, question: q.question, answer: q.answer as string })),
      { category: question.category, question: question.question, answer },
    ];

    const { context: jobContext } = await loadJobContext(session.jobId);
    const careerContext = await buildCareerContext(userId);
    const next = await generateQuestion(session.type, careerContext, jobContext, history, nextOrder + 1);

    await prisma.interviewQuestion.create({
      data: { sessionId: session.id, order: nextOrder, category: next.category, question: next.question },
    });
  }

  return updated;
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
