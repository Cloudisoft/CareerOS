import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { InterviewError } from "@/lib/interview/service";

function stripCodeFence(text: string) {
  return text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

export interface StoryInput {
  title: string;
  category: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection?: string;
}

export async function listStories(profileId: string) {
  return prisma.interviewStory.findMany({ where: { profileId }, orderBy: { updatedAt: "desc" } });
}

export async function createStory(profileId: string, input: StoryInput) {
  return prisma.interviewStory.create({ data: { profileId, ...input } });
}

export async function updateStory(profileId: string, storyId: string, input: Partial<StoryInput>) {
  const story = await prisma.interviewStory.findFirst({ where: { id: storyId, profileId } });
  if (!story) throw new InterviewError("This story could not be found.", "NOT_FOUND");
  return prisma.interviewStory.update({ where: { id: storyId }, data: input });
}

export async function deleteStory(profileId: string, storyId: string) {
  await prisma.interviewStory.deleteMany({ where: { id: storyId, profileId } });
}

interface StarShape {
  title: string;
  category: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
}

const SYSTEM_PROMPT = `You restructure one candidate's real interview answer into a reusable STAR+Reflection story for their personal story bank.
Use only what the candidate actually wrote — never invent details, numbers, or outcomes they didn't state. If a part (e.g. a measurable result) isn't in their answer, write the corresponding field honestly as what they said, even if it's qualitative rather than a hard number — do not fabricate a metric.
Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"title": "<short memorable title, 3-6 words>", "category": "<one of: leadership, conflict, failure, achievement, teamwork, problem-solving, initiative, other>", "situation": "<1-2 sentences>", "task": "<1-2 sentences>", "action": "<2-3 sentences>", "result": "<1-2 sentences>", "reflection": "<1 sentence on what they'd do again or differently>"}`;

export async function generateStoryFromAnswer(profileId: string, questionId: string) {
  const question = await prisma.interviewQuestion.findUnique({
    where: { id: questionId },
    include: { session: true },
  });
  if (!question || question.session.profileId !== profileId) {
    throw new InterviewError("This question could not be found.", "NOT_FOUND");
  }
  if (!question.answer) {
    throw new InterviewError("This question hasn't been answered yet.", "NOT_ANSWERED");
  }

  const { text, provider } = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `Question: ${question.question}\n\nCandidate's answer:\n${question.answer}\n\nRestructure this into a STAR+Reflection story.`,
    maxTokens: 500,
  });

  let parsed: StarShape;
  if (provider === "mock") {
    parsed = {
      title: "Untitled story",
      category: "other",
      situation: "[DEV MODE — no AI provider configured.]",
      task: "",
      action: question.answer.slice(0, 300),
      result: "",
      reflection: "",
    };
  } else {
    try {
      parsed = JSON.parse(stripCodeFence(text)) as StarShape;
      if (!parsed?.action) throw new Error("empty");
    } catch {
      throw new InterviewError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
    }
  }

  return prisma.interviewStory.create({
    data: {
      profileId,
      title: parsed.title,
      category: parsed.category,
      situation: parsed.situation,
      task: parsed.task,
      action: parsed.action,
      result: parsed.result,
      reflection: parsed.reflection || null,
      sourceQuestionId: questionId,
    },
  });
}
