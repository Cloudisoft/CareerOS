import { describe, expect, it, vi } from "vitest";

const ai = vi.hoisted(() => ({ reply: "", calls: 0 }));
vi.mock("@/lib/ai/gateway", () => ({
  generateText: async () => {
    ai.calls++;
    return { text: ai.reply, provider: "anthropic" };
  },
}));
vi.mock("@/lib/interview/plan", () => ({
  loadInterviewMaterial: async () => ({ resume: null, resumeText: "Senior Engineer at Northwind: rebuilt payments, p95 -40%", careerContext: "" }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    interviewStory: { findMany: async () => [] },
    application: { findFirst: async () => null },
  },
}));
vi.mock("@/lib/interview/service", () => ({ InterviewError: class extends Error {} }));
import { liveAssist, looksLikeQuestion } from "./live";

describe("Live Copilot", () => {
  it("only treats question-like speech as a possible question", () => {
    expect(looksLikeQuestion("So tell me about a time you led a project")).toBe(true);
    expect(looksLikeQuestion("What made you leave Contoso?")).toBe(true);
    expect(looksLikeQuestion("Great, thanks for joining today.")).toBe(false);
    expect(looksLikeQuestion("")).toBe(false);
  });

  it("doesn't spend an AI call on small talk", async () => {
    ai.calls = 0;
    await expect(liveAssist("u", "p", { transcript: "Thanks for making the time today." })).resolves.toMatchObject({ isQuestion: false });
    expect(ai.calls).toBe(0);
  });

  it("returns the question and short talking points from the resume", async () => {
    ai.reply = 'Here you go: {"isQuestion": true, "question": "Tell me about a performance win", "kind": "behavioral", "points": ["Northwind payments rebuild", "p95 latency -40%", "Your part: profiling", "extra"], "story": "Payments rebuild → p95 -40%"}';
    const a = await liveAssist("u", "p", { transcript: "tell me about a time you improved performance", recent: ["So, moving on."] });
    expect(a).toEqual({ isQuestion: true, question: "Tell me about a performance win", kind: "behavioral", points: ["Northwind payments rebuild", "p95 latency -40%", "Your part: profiling"], story: "Payments rebuild → p95 -40%" });
  });

  it("stays quiet when the AI reply can't be read", async () => {
    ai.reply = "sorry, can't help";
    await expect(liveAssist("u", "p", { transcript: "How did you measure that?" })).resolves.toMatchObject({ isQuestion: false });
  });
});
