import "server-only";
import { prisma } from "@/lib/prisma";

/** The same question worded with different punctuation, case or a trailing "*" gets the same key. */
export function questionKey(question: string): string {
  return question
    .toLowerCase()
    .replace(/\*+\s*$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 200);
}

export async function listAnswers(profileId: string) {
  return prisma.extensionAnswer.findMany({
    where: { profileId },
    select: { questionKey: true, question: true, answer: true, source: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });
}

/** Save answers the person gave on a form; a newer answer to the same question replaces the old one. */
export async function saveAnswers(profileId: string, answers: { question: string; answer: string; key?: string; source?: string }[]) {
  let saved = 0;
  for (const a of answers) {
    const key = a.key?.startsWith("eeo:") ? a.key : questionKey(a.question);
    if (!key || !a.answer.trim()) continue;
    await prisma.extensionAnswer.upsert({
      where: { profileId_questionKey: { profileId, questionKey: key } },
      update: { question: a.question.slice(0, 1000), answer: a.answer.slice(0, 5000), source: a.source ?? "user" },
      create: { profileId, questionKey: key, question: a.question.slice(0, 1000), answer: a.answer.slice(0, 5000), source: a.source ?? "user" },
    });
    saved++;
  }
  return saved;
}
