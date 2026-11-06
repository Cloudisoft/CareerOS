import { describe, expect, it } from "vitest";
import { fallbackPlan, fallbackQuestion, nextFocus, planBrief } from "./plan-core";
import type { ResumeContent } from "@/lib/validations/resume";

const resume: ResumeContent = {
  summary: "Backend engineer focused on payments.",
  links: { linkedin: "", github: "", portfolio: "" },
  experience: [
    { title: "Senior Engineer", company: "Northwind", location: "", startDate: "2023-06", endDate: "", isCurrent: true, bullets: ["Rebuilt the payments service, cutting p95 latency by 40%", "Led a team of 4"] },
    { title: "Engineer", company: "Contoso", location: "", startDate: "2019-01", endDate: "2022-06", isCurrent: false, bullets: ["Built the billing exports"] },
  ],
  education: [],
  skills: ["Go", "PostgreSQL", "Kafka"],
  certifications: [],
};

describe("interview plan from the resume", () => {
  it("asks about this person's real roles, numbers and gaps", () => {
    const plan = fallbackPlan(resume, "Staff Engineer at Acme\nYou have experience with Kubernetes, and knowledge of Terraform.");
    const topics = plan.focusAreas.map((f) => `${f.kind}:${f.topic}`);
    expect(plan.source).toBe("resume");
    expect(topics).toContain("project:Senior Engineer at Northwind");
    expect(plan.focusAreas.find((f) => f.kind === "claim")?.evidence).toMatch(/40%/);
    expect(topics.some((t) => t === "skill:Kubernetes")).toBe(true);
    expect(topics.some((t) => /^gap:The 1\d-month gap before Northwind/.test(t))).toBe(true);
    expect(plan.focusAreas.length).toBeLessThanOrEqual(7);
    expect(new Set(plan.focusAreas.map((f) => f.id)).size).toBe(plan.focusAreas.length);
  });

  it("still makes a sensible plan without a resume", () => {
    const plan = fallbackPlan(null, null);
    expect(plan.focusAreas.length).toBeGreaterThanOrEqual(2);
    expect(plan.focusAreas[0].kind).toBe("motivation");
  });

  it("covers each area once before going deeper on projects and claims", () => {
    const plan = fallbackPlan(resume, null);
    const ids = plan.focusAreas.map((f) => f.id);
    const asked: string[] = [];
    for (let i = 0; i < ids.length; i++) asked.push(nextFocus(plan, asked)!.id);
    expect(asked).toEqual(ids);
    const deeper = nextFocus(plan, asked)!;
    expect(["project", "claim"]).toContain(deeper.kind);
  });

  it("writes a real question for each kind of area without AI", () => {
    const plan = fallbackPlan(resume, "Staff Engineer at Acme");
    for (const f of plan.focusAreas) {
      const q = fallbackQuestion(f, 3);
      expect(q.question.length).toBeGreaterThan(20);
      expect(q.category).toContain(f.topic.slice(0, 20));
    }
    expect(fallbackQuestion(plan.focusAreas.find((f) => f.kind === "claim")!, 3).question).toMatch(/40%/);
    expect(fallbackQuestion(null, 1).question).toMatch(/background/);
  });

  it("summarises the plan for prompts", () => {
    const brief = planBrief(fallbackPlan(resume, null));
    expect(brief).toMatch(/\[f1\]/);
    expect(brief).toMatch(/Northwind/);
  });
});
