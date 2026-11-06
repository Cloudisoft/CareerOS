import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { InterviewError } from "@/lib/interview/service";
import { generateJson } from "@/lib/interview/json";
import { loadInterviewMaterial } from "@/lib/interview/plan";

/**
 * Live Copilot — the ONE genuinely real-time piece of Interview AI, and the
 * only part of this build that requires `interview-extension/`'s own
 * extension-level capabilities (tab-audio capture) rather than the web app.
 * See interview-extension/lib/live-copilot.js for the client-side consent
 * gate and capture pipeline this backs.
 *
 * Non-negotiables enforced here:
 * - No audio is ever stored by this server: each short clip is forwarded to the
 *   speech-to-text provider and discarded. Transcript snippets aren't stored either.
 * - Help is grounded ONLY in this candidate's real resume, saved stories and prep
 *   pack — never invented — and is deliberately terse: talking points, not a script.
 */

export class LiveCopilotError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Transcribes one short, self-contained audio clip (one stretch of speech, cut
 * at a pause by the extension). Deepgram when DEEPGRAM_API_KEY is set, else
 * OpenAI's transcription endpoint when OPENAI_API_KEY is set. Never returns a
 * made-up transcript: with neither configured it says so.
 */
export async function transcribeAudioChunk(audio: ArrayBuffer, mimeType: string): Promise<string> {
  const type = (mimeType || "audio/webm").split(";")[0];
  if (process.env.DEEPGRAM_API_KEY) {
    const res = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true", {
      method: "POST",
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, "Content-Type": type },
      body: audio,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LiveCopilotError(`Transcription failed (${res.status}). ${body.slice(0, 160)}`, "STT_FAILED");
    }
    const data = (await res.json()) as { results?: { channels?: { alternatives?: { transcript?: string }[] }[] } };
    return data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
  }
  if (process.env.OPENAI_API_KEY) {
    const form = new FormData();
    const ext = type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mp4") ? "mp4" : "webm";
    form.append("file", new Blob([audio], { type }), `clip.${ext}`);
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
    form.append("response_format", "json");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LiveCopilotError(`Transcription failed (${res.status}). ${body.slice(0, 160)}`, "STT_FAILED");
    }
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim();
  }
  throw new LiveCopilotError(
    "Live transcription isn't set up yet. Add DEEPGRAM_API_KEY (or OPENAI_API_KEY) on the server to turn it on.",
    "STT_NOT_CONFIGURED"
  );
}

export interface LiveAssist {
  /** Whether the interviewer has just asked a question (rather than talking, or still mid-question). */
  isQuestion: boolean;
  /** The question as asked, cleaned up. */
  question: string;
  /** Up to 3 short talking points (a few words each), from the candidate's own background. */
  points: string[];
  /** A pointer to one of their real stories that fits, e.g. "Payments rebuild → cut latency 40%". */
  story: string;
  /** What kind of question: behavioral, technical, motivation, logistics... */
  kind: string;
}

const NONE: LiveAssist = { isQuestion: false, question: "", points: [], story: "", kind: "" };

const assistSchema = z.object({
  isQuestion: z.boolean().catch(false),
  question: z.string().trim().max(400).catch(""),
  points: z.array(z.string().trim().max(90)).max(4).catch([]),
  story: z.string().trim().max(120).catch(""),
  kind: z.string().trim().max(40).catch(""),
});

/** Questions that end with a question mark, or open the way questions do ("tell me about", "walk me through"). */
export function looksLikeQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (/\?\s*$/.test(t)) return true;
  return /\b(tell me|walk me through|talk me through|describe|explain|how (do|did|would|have|are)|what (is|are|was|were|do|did|would|made)|why (do|did|would|are)|can you|could you|have you|give me an example|share an example)\b/.test(t);
}

/** What the candidate brings to a live interview: resume, saved stories, and (when picked) the job and its prep pack. */
async function liveContext(userId: string, profileId: string, applicationId: string | null) {
  const [material, stories, application] = await Promise.all([
    loadInterviewMaterial(userId, profileId),
    prisma.interviewStory.findMany({ where: { profileId, answer: { not: null } }, select: { question: true, answer: true }, take: 12 }),
    applicationId
      ? prisma.application.findFirst({
          where: { id: applicationId, profileId },
          include: { job: { include: { company: true } }, prepPack: true },
        })
      : Promise.resolve(null),
  ]);
  if (applicationId && !application) throw new InterviewError("That application could not be found.", "NOT_FOUND");
  const packStories = (application?.prepPack?.stories as unknown as { title: string; result?: string; action?: string }[] | null) ?? [];
  const storyLines = [
    ...packStories.map((s) => `${s.title}${s.result ? ` → ${s.result}` : ""}`),
    ...stories.map((s) => `${s.question}: ${String(s.answer).slice(0, 220)}`),
  ];
  const job = application ? `${application.job.title} at ${application.job.company.name}\n${application.job.description.slice(0, 1500)}` : null;
  return { material, storyLines, job };
}

/**
 * Reads the last few things the interviewer said and, when they've asked a
 * question, returns a few talking points from the candidate's own resume and
 * stories. Never a paragraph to read aloud: that sounds scripted and isn't the
 * candidate's own voice.
 */
export async function liveAssist(
  userId: string,
  profileId: string,
  input: { applicationId?: string | null; transcript: string; recent?: string[]; lastQuestion?: string }
): Promise<LiveAssist> {
  const said = [...(input.recent ?? []), input.transcript].map((s) => s.trim()).filter(Boolean).slice(-6);
  if (!said.length) return NONE;
  // Most of what an interviewer says isn't a question; only spend an AI call when the latest words could be one.
  if (!looksLikeQuestion(said.slice(-2).join(" "))) return NONE;

  const { material, storyLines, job } = await liveContext(userId, profileId, input.applicationId ?? null);

  const system = `You help a job candidate during a live interview. You receive the last few things the INTERVIEWER said (live transcript, may be imperfect or cut mid-sentence) and the candidate's real resume and stories.
1. Decide whether the interviewer has just finished asking the candidate a question. Small talk, statements, or a question that is clearly still being asked => isQuestion false. If it's the same question as "already answered" below, isQuestion false.
2. If it is a question: restate it briefly and clearly (question), classify it (kind: behavioral, technical, experience, motivation, situational, logistics, or other), and give up to 3 talking points the candidate can build their answer around — each 2-8 words, drawn ONLY from their resume/stories (name the real project, company, number or skill). If one of their stories fits, give a pointer to it as "story" in the form "<short label> → <outcome>".
NEVER write sentences for them to read aloud. NEVER invent experience, numbers or employers. For logistics questions (salary, notice period, start date), points can be reminders like "Notice: check your profile".
Reply with ONLY JSON: {"isQuestion": true|false, "question": "", "kind": "", "points": [""], "story": ""}`;

  const prompt = `Interviewer, most recent last:\n${said.map((s) => `- ${s}`).join("\n")}${
    input.lastQuestion ? `\n\nAlready answered (don't repeat): ${input.lastQuestion}` : ""
  }\n\nCandidate's resume:\n${(material.resumeText || material.careerContext).slice(0, 3500)}${
    storyLines.length ? `\n\nTheir prepared stories:\n${storyLines.map((s, i) => `${i + 1}. ${s}`).join("\n").slice(0, 2000)}` : ""
  }${job ? `\n\nThe job they're interviewing for:\n${job}` : ""}`;

  const res = await generateJson({ system, prompt, maxTokens: 300 }, assistSchema);
  if (!res.ok) {
    if (res.provider === "mock") {
      return { isQuestion: true, question: said[said.length - 1], kind: "dev", points: ["[DEV MODE] set an AI key for real hints"], story: "" };
    }
    return NONE;
  }
  const v = res.value;
  if (!v.isQuestion || !v.question) return NONE;
  return { isQuestion: true, question: v.question, kind: v.kind, points: v.points.filter(Boolean).slice(0, 3), story: v.story };
}

interface LiveHintResult {
  type: "story" | "keywords" | "none";
  text: string;
}

/** For extension versions before 1.2: one short hint per transcript snippet, now from liveAssist. */
export async function generateLiveHint(userId: string, profileId: string, applicationId: string, transcript: string): Promise<LiveHintResult> {
  const a = await liveAssist(userId, profileId, { applicationId, transcript });
  if (!a.isQuestion) return { type: "none", text: "" };
  if (a.story) return { type: "story", text: `Story: ${a.story}`.slice(0, 120) };
  return { type: "keywords", text: a.points.join(", ").slice(0, 120) };
}
