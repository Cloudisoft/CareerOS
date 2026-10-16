import "server-only";
import { prisma } from "@/lib/prisma";
import { scoreAnswer, InterviewError, type AnswerScore } from "@/lib/interview/service";

/**
 * "My Stories" — a locked personal answer bank for the handful of core
 * behavioral questions almost every interview asks. The candidate practices
 * each with the same AI coach that scores mock-interview answers (see
 * scoreAnswer in service.ts), then "locks" one final wording they've
 * approved. Read and edited from both the web app
 * (src/app/(app)/interview-ai/stories) and the standalone, practice-only
 * `interview-extension/` companion extension via these same REST routes.
 */
export const CORE_STORY_QUESTIONS = [
  "Tell me about yourself.",
  "What is your greatest strength?",
  "What is your greatest weakness?",
  "Why do you want this role?",
  "Describe a conflict you resolved at work.",
  "Describe a time you failed. What did you learn?",
] as const;

export type CoreStoryQuestion = (typeof CORE_STORY_QUESTIONS)[number];

export interface StoryRow {
  question: string;
  answer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  lockedAt: Date | null;
  updatedAt: Date | null;
}

function isCoreQuestion(question: string): question is CoreStoryQuestion {
  return (CORE_STORY_QUESTIONS as readonly string[]).includes(question);
}

/** The six core questions, merged with whatever the candidate has already saved. */
export async function listStories(profileId: string): Promise<StoryRow[]> {
  const saved = await prisma.interviewStory.findMany({ where: { profileId } });
  const byQuestion = new Map(saved.map((s) => [s.question, s]));

  return CORE_STORY_QUESTIONS.map((question) => {
    const row = byQuestion.get(question);
    return row
      ? {
          question,
          answer: row.answer,
          score: row.score,
          feedback: row.feedback,
          strengths: row.strengths,
          improvements: row.improvements,
          lockedAt: row.lockedAt,
          updatedAt: row.updatedAt,
        }
      : { question, answer: null, score: null, feedback: null, strengths: [], improvements: [], lockedAt: null, updatedAt: null };
  });
}

/** Scores a draft answer and saves it, without locking it. */
export async function practiceStory(profileId: string, question: string, answer: string): Promise<AnswerScore> {
  if (!isCoreQuestion(question)) {
    throw new InterviewError("Not one of the core story questions.", "NOT_FOUND");
  }

  const result = await scoreAnswer(question, "Behavioral", answer);

  await prisma.interviewStory.upsert({
    where: { profileId_question: { profileId, question } },
    create: {
      profileId,
      question,
      answer,
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
    },
    update: {
      answer,
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      // Editing an already-locked answer un-locks it — it's no longer the
      // exact wording the candidate approved.
      lockedAt: null,
    },
  });

  return result;
}

/** Approves the current (or a freshly supplied) wording as the final answer for this question. */
export async function lockStory(profileId: string, question: string, answer?: string) {
  if (!isCoreQuestion(question)) {
    throw new InterviewError("Not one of the core story questions.", "NOT_FOUND");
  }

  const existing = await prisma.interviewStory.findUnique({ where: { profileId_question: { profileId, question } } });
  const finalAnswer = (answer ?? existing?.answer ?? "").trim();
  if (!finalAnswer) {
    throw new InterviewError("Write and score an answer before locking it.", "VALIDATION_ERROR");
  }

  // Re-score only when the wording actually changed at lock time, so locking
  // an already-scored draft doesn't burn an extra AI call.
  const needsScore = !existing || existing.answer !== finalAnswer || existing.score == null;
  const result = needsScore ? await scoreAnswer(question, "Behavioral", finalAnswer) : null;

  return prisma.interviewStory.upsert({
    where: { profileId_question: { profileId, question } },
    create: {
      profileId,
      question,
      answer: finalAnswer,
      score: result?.score ?? null,
      feedback: result?.feedback ?? null,
      strengths: result?.strengths ?? [],
      improvements: result?.improvements ?? [],
      lockedAt: new Date(),
    },
    update: {
      answer: finalAnswer,
      ...(result
        ? { score: result.score, feedback: result.feedback, strengths: result.strengths, improvements: result.improvements }
        : {}),
      lockedAt: new Date(),
    },
  });
}

export async function unlockStory(profileId: string, question: string) {
  if (!isCoreQuestion(question)) {
    throw new InterviewError("Not one of the core story questions.", "NOT_FOUND");
  }
  return prisma.interviewStory.updateMany({ where: { profileId, question }, data: { lockedAt: null } });
}
