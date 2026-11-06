/**
 * Interview AI practice flow against a real database, with the AI replaced by a script. Runs only when
 * TEST_DATABASE_URL points at a migrated, disposable Postgres (it creates and deletes its own rows).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

/* Each AI call is answered by the first matching rule: plan, question or score. */
const ai = vi.hoisted(() => ({ plan: "" as string | Error, question: "" as string | Error, score: "" as string | Error, calls: [] as string[] }));
vi.mock("@/lib/ai/gateway", () => ({
  generateText: async ({ system }: { system: string }) => {
    const kind = /plan the interview/i.test(system) ? "plan" : /scoring one candidate/i.test(system) ? "score" : "question";
    ai.calls.push(kind);
    const r = ai[kind as "plan" | "question" | "score"];
    if (r instanceof Error) throw r;
    return { text: r, provider: "anthropic" };
  },
}));

describe.skipIf(!url)("Interview AI practice (database)", async () => {
  const { prisma } = await import("@/lib/prisma");
  const service = await import("@/lib/interview/service");
  let userId = "";
  let profileId = "";
  const email = `interview-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: "x", firstName: "Ada", lastName: "Lovelace" } });
    userId = user.id;
    profileId = (await prisma.candidateProfile.create({ data: { userId, currentTitle: "Senior Engineer", currentCompany: "Northwind" } })).id;
    await prisma.resume.create({
      data: {
        profileId,
        name: "Main",
        isPrimary: true,
        content: {
          summary: "Backend engineer.",
          links: { linkedin: "", github: "", portfolio: "" },
          experience: [{ title: "Senior Engineer", company: "Northwind", location: "", startDate: "2023-01", endDate: "", isCurrent: true, bullets: ["Rebuilt payments, p95 latency -40%"] }],
          education: [],
          skills: ["Go", "Kafka"],
          certifications: [],
        },
      },
    });
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("reads the resume into a plan and opens with a question from it", async () => {
    ai.plan = 'Plan:\n```json\n{"summary": "Backend engineer at Northwind.", "focusAreas": [{"topic": "Payments rebuild", "kind": "project", "why": "Biggest project", "evidence": "Rebuilt payments", "angles": ["ownership"]}, {"topic": "p95 -40%", "kind": "claim", "why": "Check the number", "evidence": "p95 latency -40%", "angles": []}, {"topic": "Kafka at scale", "kind": "skill", "why": "", "evidence": "", "angles": []}], "strengths": ["Go"], "watchOuts": ["Numbers"]}\n```';
    ai.question = '{"category": "Project deep-dive", "question": "Tell me about rebuilding payments at Northwind.", "focusId": "f1"}';
    const s = await service.startSession(userId, profileId, "MIXED");
    const plan = s.plan as { source: string; focusAreas: { topic: string }[] };
    expect(plan.source).toBe("ai");
    expect(plan.focusAreas.map((f) => f.topic)).toEqual(["Payments rebuild", "p95 -40%", "Kafka at scale"]);
    expect(s.questions[0]).toMatchObject({ question: "Tell me about rebuilding payments at Northwind.", focusId: "f1" });
  });

  it("never stalls: AI down at the start still gives a plan from the resume and a first question", async () => {
    ai.plan = new Error("provider down");
    ai.question = new Error("provider down");
    const s = await service.startSession(userId, profileId, "BEHAVIORAL");
    expect((s.plan as { source: string }).source).toBe("resume");
    expect(s.questions[0].question.length).toBeGreaterThan(20);
  });

  it("keeps the answer and moves on when scoring fails; rescoring fills it in; double submit is harmless", async () => {
    ai.plan = new Error("down");
    ai.question = '{"category": "Opener", "question": "Walk me through your time at Northwind."}';
    const s = await service.startSession(userId, profileId, "MIXED");
    const q1 = s.questions[0];

    ai.score = "not json at all";
    ai.question = 'Sure: {"category": "Claim", "question": "How did you measure the 40% latency drop?", "focusId": "f2"}';
    const saved = await service.submitAnswer(userId, profileId, s.id, q1.id, "I led the payments rebuild.");
    expect(saved.answer).toBe("I led the payments rebuild.");
    expect(saved.score).toBeNull();

    await service.submitAnswer(userId, profileId, s.id, q1.id, "I led the payments rebuild.");
    let session = await service.getSession(profileId, s.id);
    expect(session.questions).toHaveLength(2);
    expect(session.questions[1].question).toBe("How did you measure the 40% latency drop?");

    ai.score = '{"score": 72, "feedback": "Clear ownership; add the result.", "strengths": ["Ownership"], "improvements": ["Quantify"]}';
    const rescored = await service.retryAnswer(profileId, s.id, q1.id, "I led the payments rebuild.");
    expect(rescored.score).toBe(72);

    // Question generation failing mid-session still gives the next question (from the plan).
    ai.question = new Error("timeout");
    await service.submitAnswer(userId, profileId, s.id, session.questions[1].id, "We used p95 from our APM before and after.");
    session = await service.getSession(profileId, s.id);
    expect(session.questions).toHaveLength(3);
    expect(session.questions[2].question.length).toBeGreaterThan(20);
    expect(session.questions[1].score).toBe(72);
  });

  it("finishes a session even if one answer never got a score", async () => {
    ai.plan = new Error("down");
    ai.question = '{"category": "Opener", "question": "Walk me through your background please."}';
    const s = await service.startSession(userId, profileId, "MIXED");
    ai.score = new Error("down");
    await service.submitAnswer(userId, profileId, s.id, s.questions[0].id, "Backend engineer at Northwind.");
    const done = await service.completeSession(profileId, s.id);
    expect(done.status).toBe("COMPLETED");
  });
});
