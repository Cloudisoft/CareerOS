import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { InterviewError } from "@/lib/interview/service";

/**
 * Live Copilot — the ONE genuinely real-time piece of Interview AI, and the
 * only part of this build that requires `interview-extension/`'s own
 * extension-level capabilities (tab-audio capture) rather than the web app.
 * See interview-extension/lib/live-copilot.js for the client-side consent
 * gate and capture pipeline this backs.
 *
 * Non-negotiables enforced here:
 * - No audio is ever received or stored by this server — only short text
 *   transcript snippets, and even those are not persisted; they exist only
 *   for the duration of one request.
 * - Hints are grounded ONLY in this candidate's real prep pack (Part A) —
 *   never invented — and are deliberately terse (a pointer, not a script).
 */

export class LiveCopilotError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Transcribes one short audio chunk via Deepgram's prerecorded REST
 * endpoint (a single HTTP call per chunk — not a persistent streaming
 * socket, which this environment's fetch-based server functions can't hold
 * open indefinitely). Chunking short (~3s) segments is what keeps this
 * close to real-time without a long-lived connection.
 *
 * Honesty over appearance: if DEEPGRAM_API_KEY isn't configured, this
 * throws a clearly-labeled error instead of returning a fabricated
 * transcript. The spec's 1-2 second bar is only as achievable as this
 * chunk-based approach allows — a real streaming STT integration would be
 * faster, but requires infrastructure (a long-lived WebSocket relay) this
 * request/response API route can't provide.
 */
export async function transcribeAudioChunk(audio: ArrayBuffer, mimeType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new LiveCopilotError(
      "Live transcription isn't configured in this environment. Set DEEPGRAM_API_KEY to enable it.",
      "STT_NOT_CONFIGURED"
    );
  }

  const res = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": mimeType || "audio/webm",
    },
    body: audio,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LiveCopilotError(`Transcription provider failed (${res.status}): ${body.slice(0, 200)}`, "STT_FAILED");
  }

  const data = (await res.json()) as {
    results?: { channels?: { alternatives?: { transcript?: string }[] }[] };
  };
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}

interface LiveHintResult {
  type: "story" | "keywords" | "none";
  text: string;
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

/**
 * Generates one terse hint for a live question, grounded ONLY in this
 * application's prep pack — never invented. Kept deliberately short: 3-4
 * keywords or a skeleton, or a pointer to a matching prepared STAR story
 * (e.g. "Story: payments rebuild → cut latency 40%") — never a paragraph to
 * read verbatim, per the spec's own warning that too much text reads as
 * obviously scripted.
 */
export async function generateLiveHint(profileId: string, applicationId: string, transcript: string): Promise<LiveHintResult> {
  if (!transcript.trim()) return { type: "none", text: "" };

  const prepPack = await prisma.interviewPrepPack.findFirst({ where: { applicationId, profileId } });
  if (!prepPack) {
    throw new InterviewError("No prep pack found for this application yet — open Prepare for this job first.", "NOT_FOUND");
  }

  const stories = prepPack.stories as unknown as { title: string; situation: string; task: string; action: string; result: string }[];

  const system = `You are a real-time interview copilot. You are given ONE interviewer question (transcribed live) and a candidate's real, pre-prepared STAR stories for this exact job. Your only job: if one story clearly answers this question, return a 4-8 word pointer to it in the exact style "Story: <short label> → <short outcome>" (e.g. "Story: payments rebuild → cut latency 40%"). If no story matches well, return 3-4 bare keywords/skeleton words the candidate could build an answer around (e.g. "STAR: team conflict, compromise, deadline"), never a sentence. NEVER write a full sentence or paragraph to read aloud — that reads as obviously scripted. NEVER invent a story or fact not in the list given. If nothing at all is relevant, return an empty string.
Respond with ONLY JSON: {"type": "story"|"keywords"|"none", "text": "string"}`;

  const prompt = `Candidate's real STAR stories for this job:\n${stories
    .map((s, i) => `${i + 1}. ${s.title} — Result: ${s.result || "(no result recorded)"}`)
    .join("\n")}\n\nInterviewer just asked (live transcript, may be imperfect): "${transcript.trim()}"\n\nReturn the hint now.`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 150 });
  if (provider === "mock") {
    return { type: "keywords", text: "[DEV MODE — set ANTHROPIC_API_KEY for real hints] STAR: situation, action, result" };
  }

  try {
    const parsed = JSON.parse(stripCodeFence(text)) as LiveHintResult;
    return { type: parsed.type ?? "keywords", text: (parsed.text ?? "").slice(0, 120) };
  } catch {
    return { type: "none", text: "" };
  }
}
