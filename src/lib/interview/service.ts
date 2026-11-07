import "server-only";
import { roleInterviewContext } from "@/lib/ai-work/service";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import { recomputeJobReadiness } from "@/lib/interview/prep";
import type { InterviewType, Prisma } from "@prisma/client";
import { z } from "zod";
import { generateJson } from "@/lib/interview/json";
import {
  buildInterviewPlan,
  fallbackPlan,
  fallbackQuestion,
  loadInterviewMaterial,
  nextFocus,
  planBrief,
  type InterviewMaterial,
  type InterviewPlan,
} from "@/lib/interview/plan";

export class InterviewError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/** 7 rather than a token 5 — long enough to actually walk a candidate
    through a real difficulty arc (warm-up -> depth -> job-specific/senior)
    instead of ending just as it gets interesting. */
export const QUESTIONS_PER_SESSION = 7;

const TYPE_LABEL: Record<InterviewType, string> = {
  BEHAVIORAL: "behavioral (STAR-style: situation, task, action, result)",
  TECHNICAL: "role-specific technical and problem-solving",
  MIXED: "a mix of behavioral and role-specific technical",
};

interface GeneratedQuestion {
  category: string;
  question: string;
  focusId?: string | null;
}

interface AnsweredTurn {
  category: string;
  question: string;
  answer: string;
}

/**
 * A real interview escalates: it doesn't open with the hardest question it
 * has, and it doesn't stay easy the whole way through either. Split the
 * session into thirds — warm-up, then rising difficulty, then a late stretch
 * that's either tied directly to the target job's actual responsibilities
 * (when one is attached) or pushed to a senior/strategic bar (when it
 * isn't) — so the arc is real instead of every question landing at the same
 * medium difficulty regardless of position in the session.
 */
function difficultyGuidance(questionNumber: number, total: number, hasJob: boolean): string {
  const progress = questionNumber / total;
  if (progress <= 0.35) {
    return "DIFFICULTY: this is an early, warm-up-tier question — foundational and approachable (background, motivation, a straightforward past experience). Keep it easy enough that the candidate can answer confidently and settle in.";
  }
  if (progress <= 0.75) {
    return "DIFFICULTY: this is a mid-interview question — raise the bar meaningfully above the opening questions. Push for real depth: trade-offs they weighed, a harder scenario, a more demanding technical or behavioral challenge.";
  }
  return hasJob
    ? "DIFFICULTY: this is a late-interview question — make it specific to the target job below (its actual responsibilities, required skills, or domain), held to a senior, high-difficulty bar. This is where the interview should feel like it's really testing fit for this exact role."
    : "DIFFICULTY: this is a late-interview question — make it the hardest and most senior-level question of the session: a strategic trade-off, a system-level or leadership scenario, or something that would clearly separate a strong candidate from an average one.";
}

const questionSchema = z.object({
  category: z.string().trim().min(1).max(120).catch("Interview"),
  question: z.string().trim().min(8).max(800),
  focusId: z.string().trim().max(10).nullable().optional(),
});

/**
 * Generates ONE question at a time, live — question 1 opens the interview;
 * every question after that is generated only once the candidate has
 * answered the previous one, reading their actual answer and deciding
 * whether to probe deeper on it or move to new ground, the way a real
 * interviewer conducts a conversation rather than reading a fixed script.
 *
 * Questions come from the interview plan (what CareerOS found worth asking
 * about in this person's resume and the job). If the AI can't answer, the
 * next planned area is asked with a question written without AI, so a session
 * never stalls on an AI error.
 */
async function generateQuestion(
  type: InterviewType,
  plan: InterviewPlan,
  material: InterviewMaterial,
  jobContext: string | null,
  history: (AnsweredTurn & { focusId?: string | null })[],
  questionNumber: number
): Promise<GeneratedQuestion> {
  const label = TYPE_LABEL[type];
  const asked = history.map((h) => h.focusId).filter((x): x is string => Boolean(x));
  const suggested = nextFocus(plan, asked);
  const phaseGuidance = difficultyGuidance(questionNumber, QUESTIONS_PER_SESSION, Boolean(jobContext));
  const system = `You are an expert interviewer conducting a live ${label} interview with a candidate, one question at a time — this is question ${questionNumber} of ${QUESTIONS_PER_SESSION}.
You have already read their resume and planned the interview (the plan is below). Ask about THIS candidate: name their actual projects, companies, numbers and skills from the resume. Never ask a generic question that could be asked of anyone, and never invent facts about them.
${phaseGuidance}
${
  history.length > 0
    ? `Read their most recent answer closely. If it left something specific worth probing — a vague claim, a result without a number, "we" where you need "I", a decision they glossed over — ask a natural follow-up about exactly that and keep the same focusId. Otherwise move to the next planned area${suggested ? ` (suggested: ${suggested.id}, "${suggested.topic}")` : ""}. Don't repeat ground already covered.`
    : `This is the opening question — welcoming, and about their background${suggested ? ` (start with ${suggested.id}, "${suggested.topic}")` : ""}.`
}
Keep the question to 1-3 sentences, spoken naturally, one question at a time (no multi-part lists).
Respond with ONLY a JSON object: {"category": "short label", "question": "string", "focusId": "f1"}`;

  const historyBlock = history.length
    ? `\n\nQuestions asked so far and the candidate's answers, in order:\n${history
        .map((h, i) => `${i + 1}. [${h.category}${h.focusId ? ` · ${h.focusId}` : ""}] ${h.question}\nCandidate's answer: ${h.answer.slice(0, 1500)}`)
        .join("\n\n")}`
    : "";

  const prompt = `${planBrief(plan)}\n\nResume:\n${(material.resumeText || material.careerContext).slice(0, 4000)}${
    jobContext ? `\n\nTarget job:\n${jobContext.slice(0, 2000)}` : ""
  }${historyBlock}\n\nAsk question ${questionNumber} of ${QUESTIONS_PER_SESSION} now.`;

  const res = await generateJson({ system, prompt, maxTokens: 400 }, questionSchema);
  if (res.ok) {
    const focusId = res.value.focusId && plan.focusAreas.some((f) => f.id === res.value.focusId) ? res.value.focusId : suggested?.id ?? null;
    return { category: res.value.category, question: res.value.question, focusId };
  }
  if (res.provider === "mock") {
    const q = fallbackQuestion(suggested, questionNumber);
    return { ...q, category: `Dev mode · ${q.category}`, focusId: suggested?.id ?? null };
  }
  console.error(`Interview question ${questionNumber}: AI reply unusable, asking the planned question instead (${res.error})`);
  return { ...fallbackQuestion(suggested, questionNumber), focusId: suggested?.id ?? null };
}

async function loadJobContext(jobId?: string | null): Promise<{ context: string | null; validId: string | undefined }> {
  if (!jobId) return { context: null, validId: undefined };
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) return { context: null, validId: undefined };
  return { context: `${job.title} at ${job.company.name}\n${job.description.slice(0, 3000)}`, validId: job.id };
}

async function sessionJobContext(session: { aiWorkRoleId: string | null; jobId: string | null }) {
  if (session.aiWorkRoleId) return (await roleInterviewContext(session.aiWorkRoleId))?.context ?? null;
  return (await loadJobContext(session.jobId)).context;
}

/** The plan saved on a session, or one built from the resume for sessions started before plans existed. */
function sessionPlan(stored: unknown, material: InterviewMaterial, jobContext: string | null): InterviewPlan {
  const p = stored as InterviewPlan | null;
  if (p && Array.isArray(p.focusAreas) && p.focusAreas.length) return p;
  return fallbackPlan(material.resume, jobContext);
}

export interface AnswerScore {
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

const scoreSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  feedback: z.string().trim().min(1).max(1200),
  strengths: z.array(z.string().trim().max(200)).catch([]),
  improvements: z.array(z.string().trim().max(200)).catch([]),
});

export async function scoreAnswer(question: string, category: string, answer: string, resumeHint?: string): Promise<AnswerScore> {
  const system = `You are an expert interview coach scoring one candidate's answer to an interview question.
Score honestly on structure (e.g. STAR for behavioral questions), specificity (real examples, their own actions, numbers), relevance to the question, and clarity. Do not invent facts about the candidate beyond what they said; do not be falsely encouraging.${
    resumeHint ? " If their resume (below) has a stronger example or a number they could have used, say so in one improvement." : ""
  }
Respond with ONLY JSON: {"score": <integer 0-100>, "feedback": "<2-3 sentences>", "strengths": ["<short item>", ...up to 3], "improvements": ["<short item>", ...up to 3]}`;

  const prompt = `Question (${category}): ${question}\n\nCandidate's answer:\n${answer}${resumeHint ? `\n\nTheir resume, for reference:\n${resumeHint.slice(0, 2500)}` : ""}\n\nScore this answer.`;

  const res = await generateJson({ system, prompt, maxTokens: 500 }, scoreSchema);
  if (res.ok) {
    return {
      score: Math.max(0, Math.min(100, Math.round(res.value.score))),
      feedback: res.value.feedback,
      strengths: res.value.strengths.slice(0, 3),
      improvements: res.value.improvements.slice(0, 3),
    };
  }
  if (res.provider === "mock") return mockScore(answer);
  throw new InterviewError("Your answer is saved, but scoring didn't finish. Press Rescore to try again.", "AI_PARSE_ERROR");
}

export interface SuggestedAnswer {
  /** 3-4 beats to hit, in order (e.g. situation, what you did, result). */
  outline: string[];
  /** A sample answer in the candidate's voice, built only from their own resume and saved stories. */
  sample: string;
  /** Which of their experiences it draws on, e.g. "Checkout rebuild at Northwind". */
  basedOn: string;
}

const suggestSchema = z.object({
  outline: z.array(z.string().trim().min(1).max(160)).min(1).max(5),
  sample: z.string().trim().min(1).max(1600),
  basedOn: z.string().trim().max(160).catch(""),
});

/**
 * A suggested answer for a mock-interview question, for practice: an outline and a sample answer built from
 * the candidate's own resume and saved stories (never invented experience). Not stored; the candidate still
 * answers in their own words and is scored on what they say.
 */
export async function suggestAnswer(userId: string, profileId: string, sessionId: string, questionId: string): Promise<SuggestedAnswer> {
  const session = await getSession(profileId, sessionId);
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new InterviewError("This question could not be found.", "NOT_FOUND");
  const [material, stories] = await Promise.all([
    loadInterviewMaterial(userId, profileId),
    prisma.interviewStory.findMany({ where: { profileId, answer: { not: null } }, select: { question: true, answer: true }, take: 8 }),
  ]);
  const jobContext = await sessionJobContext(session);
  const storyText = stories.map((s) => `- ${s.question}: ${String(s.answer).slice(0, 400)}`).join("\n");

  const system = `You are an interview coach helping a candidate PRACTISE. Write a strong example answer to the question, in the first person, as the candidate would say it out loud (about 60-90 seconds spoken, 120-200 words).
Use ONLY facts from their resume, profile and saved stories below. Never invent employers, projects, numbers or skills. If their material has no fitting example, write a short honest answer that says what they would draw on, and keep numbers out.
For behavioral questions follow STAR (situation, task, action, result). Keep it natural and conversational, not a list.
Respond with ONLY JSON: {"outline": ["<beat 1>", "<beat 2>", "<beat 3>"], "sample": "<the spoken answer>", "basedOn": "<which experience it uses, a few words>"}`;
  const prompt = [
    `Question (${question.category}): ${question.question}`,
    jobContext ? `The job:\n${jobContext.slice(0, 1500)}` : "",
    material.resumeText ? `Their resume:\n${material.resumeText.slice(0, 3500)}` : "They have no resume on file.",
    material.careerContext ? `Their profile:\n${material.careerContext.slice(0, 1200)}` : "",
    storyText ? `Their saved stories:\n${storyText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await generateJson({ system, prompt, maxTokens: 700 }, suggestSchema);
  if (res.ok) return { outline: res.value.outline.slice(0, 4), sample: res.value.sample, basedOn: res.value.basedOn };

  // No AI available: a structure to follow, pointing at their most recent role, so the button never comes back empty.
  const recent = material.resume?.experience?.[0];
  const where = recent ? `${recent.title || "my role"}${recent.company ? ` at ${recent.company}` : ""}` : "a recent project";
  const bullet = recent?.bullets?.[0]?.trim().replace(/\.$/, "");
  return {
    outline: [`Set the scene: ${where}`, "What you were responsible for", "What you did, step by step", "The result, and what you learned"],
    sample: `${recent ? `In my role as ${where}` : "On a recent project"}${bullet ? `, one thing I'm proud of: ${bullet}.` : ", I took on something like this."} I'd walk through what I owned, the decisions I made and why, and finish with the result and what I'd do differently.`,
    basedOn: where,
  };
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

export async function startSession(userId: string, profileId: string, type: InterviewType, jobId?: string, aiWorkRoleId?: string) {
  const role = await roleInterviewContext(aiWorkRoleId);
  const { context: jobContext, validId: validJobId } = role ? { context: role.context, validId: undefined } : await loadJobContext(jobId);
  const material = await loadInterviewMaterial(userId, profileId);
  // Read the resume (and job) first, then open the interview from that plan.
  const plan = await buildInterviewPlan(material, jobContext, TYPE_LABEL[type]);
  const first = await generateQuestion(type, plan, material, jobContext, [], 1);

  return prisma.interviewSession.create({
    data: {
      profileId,
      jobId: validJobId,
      aiWorkRoleId: role?.id,
      type,
      plan: plan as unknown as Prisma.InputJsonValue,
      questions: { create: [{ order: 0, category: first.category, question: first.question, focusId: first.focusId ?? null }] },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

/**
 * Saves the answer first (so it's never lost to an AI error), then scores it and writes the next question at
 * the same time. If scoring fails the answer stays saved without a score and can be rescored; the next
 * question always arrives (from the plan if the AI can't write one). Pressing submit twice is harmless.
 */
export async function submitAnswer(userId: string, profileId: string, sessionId: string, questionId: string, answer: string) {
  const session = await getSession(profileId, sessionId);
  if (session.status !== "IN_PROGRESS") {
    throw new InterviewError("This session has already been completed.", "SESSION_COMPLETED");
  }
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new InterviewError("This question could not be found.", "NOT_FOUND");
  const nextOrder = question.order + 1;
  const nextExists = session.questions.some((q) => q.order === nextOrder);
  if (question.answer != null && question.score != null && (nextExists || nextOrder >= QUESTIONS_PER_SESSION)) return question;

  await prisma.interviewQuestion.update({ where: { id: questionId }, data: { answer, answeredAt: new Date() } });

  const needsNext = nextOrder < QUESTIONS_PER_SESSION && !nextExists;
  const material = await loadInterviewMaterial(userId, profileId);
  const jobContext = needsNext ? await sessionJobContext(session) : null;

  const [scored, next] = await Promise.allSettled([
    scoreAnswer(question.question, question.category, answer, material.resumeText || undefined),
    needsNext
      ? (async () => {
          const plan = sessionPlan(session.plan, material, jobContext);
          const history = [
            ...session.questions
              .filter((q) => q.answer != null && q.id !== question.id)
              .map((q) => ({ category: q.category, question: q.question, answer: q.answer as string, focusId: q.focusId })),
            { category: question.category, question: question.question, answer, focusId: question.focusId },
          ];
          return generateQuestion(session.type, plan, material, jobContext, history, nextOrder + 1);
        })()
      : Promise.resolve(null),
  ]);

  if (needsNext) {
    const q: GeneratedQuestion =
      next.status === "fulfilled" && next.value ? next.value : { ...fallbackQuestion(null, nextOrder + 1), focusId: null };
    // A second submit racing this one may have added it already.
    const exists = await prisma.interviewQuestion.findFirst({ where: { sessionId: session.id, order: nextOrder }, select: { id: true } });
    if (!exists) {
      await prisma.interviewQuestion.create({
        data: { sessionId: session.id, order: nextOrder, category: q.category, question: q.question, focusId: q.focusId ?? null },
      });
    }
  }

  if (scored.status === "rejected") {
    console.error(`Interview scoring failed for question ${questionId}:`, scored.reason);
    return prisma.interviewQuestion.findUniqueOrThrow({ where: { id: questionId } });
  }
  const result = scored.value;
  return prisma.interviewQuestion.update({
    where: { id: questionId },
    data: { score: result.score, feedback: result.feedback, strengths: result.strengths, improvements: result.improvements },
  });
}

/**
 * Retries a single already-answered question in place: re-scores a fresh
 * attempt without advancing the session or generating a new question,
 * distinct from the normal one-shot linear flow in submitAnswer. Only
 * allowed while the session is still in progress.
 */
export async function retryAnswer(profileId: string, sessionId: string, questionId: string, answer: string) {
  const session = await getSession(profileId, sessionId);
  if (session.status !== "IN_PROGRESS") {
    throw new InterviewError("This session has already been completed.", "SESSION_COMPLETED");
  }
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new InterviewError("This question could not be found.", "NOT_FOUND");
  if (question.answer == null) {
    throw new InterviewError("Answer this question once before retrying it.", "VALIDATION_ERROR");
  }

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
      attempts: { increment: 1 },
    },
  });
}

export interface SessionRecap {
  jobTitle: string | null;
  companyName: string | null;
  overallScore: number | null;
  questionsCovered: { category: string; question: string; score: number | null }[];
  wentWell: string[];
  toImprove: string[];
}

/** Aggregates the per-question feedback already generated by scoreAnswer —
    never regenerates it — into a short "Review" recap. */
export async function getSessionRecap(profileId: string, sessionId: string): Promise<SessionRecap> {
  const session = await getSession(profileId, sessionId);
  const scored = session.questions.filter((q) => q.score != null);

  const wentWell = Array.from(new Set(scored.flatMap((q) => q.strengths))).slice(0, 2);
  const toImprove = Array.from(new Set(scored.flatMap((q) => q.improvements))).slice(0, 2);

  return {
    jobTitle: session.job?.title ?? null,
    companyName: session.job?.company.name ?? null,
    overallScore: session.overallScore,
    questionsCovered: session.questions.map((q) => ({ category: q.category, question: q.question, score: q.score })),
    wentWell,
    toImprove,
  };
}

/** Resolves the Application this session's job maps to (if any) so the
    Review step can offer a one-click stage confirm without the UI needing
    to know the applicationId separately. */
export async function getApplicationForSession(profileId: string, sessionId: string) {
  const session = await getSession(profileId, sessionId);
  if (!session.jobId) return null;
  return prisma.application.findUnique({ where: { profileId_jobId: { profileId, jobId: session.jobId } } });
}

/** A one-click thank-you email draft, grounded in the actual questions asked
    and the real company/role — same generateText-through-the-gateway
    discipline as generateCoverLetter in src/lib/resume/cover-letter.ts. */
export async function draftThankYouEmail(userId: string, profileId: string, sessionId: string) {
  const session = await getSession(profileId, sessionId);
  if (!session.job) {
    throw new InterviewError("This session isn't linked to a job, so there's no interviewer to thank.", "VALIDATION_ERROR");
  }

  const careerContext = await buildCareerContext(userId);
  const questionsAsked = session.questions.map((q) => `- [${q.category}] ${q.question}`).join("\n");

  const system = `You write real, specific post-interview thank-you emails grounded in one candidate's actual background and the real questions they were asked. Never invent employers, dates, or achievements beyond the CareerContext given. Warm, professional, concise — 3 short paragraphs max. Reference at least one real topic from the questions asked, naturally, not as a list. No placeholders like "[Company Name]" — use the real company and role given. Return only the email body, with a simple greeting and sign-off — no subject line.`;

  const prompt = `CareerContext for this candidate:\n${careerContext}\n\nThey just finished a practice/interview session for:\nRole: ${session.job.title}\nCompany: ${session.job.company.name}\n\nQuestions covered:\n${questionsAsked}\n\nWrite the thank-you email.`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 500 });
  return { text, provider };
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
  if (session.jobId) {
    await recomputeJobReadiness(profileId, session.jobId).catch((error) => {
      console.error(`Failed to recompute job readiness for profile ${profileId}, job ${session.jobId}:`, error);
    });
  }

  return updated;
}
