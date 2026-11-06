import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";
import { resumeContentSchema, type ResumeContent } from "@/lib/validations/resume";
import { generateJson } from "@/lib/interview/json";
import { fallbackPlan, type InterviewPlan } from "@/lib/interview/plan-core";

export { fallbackPlan, nextFocus, fallbackQuestion, planBrief } from "@/lib/interview/plan-core";
export type { InterviewPlan, FocusArea, FocusKind } from "@/lib/interview/plan-core";

/**
 * Before the first question, CareerOS reads the person's resume (and the job, when there is one) the way a
 * real interviewer prepares: which projects to dig into, which claims and numbers to check, which skills the
 * role needs that the resume only touches on, and any gap worth asking about. Every question in the session
 * is then drawn from that plan, so the interview is about this person's actual background, not generic.
 */

export interface InterviewMaterial {
  /** The person's resume as text (primary resume, else the newest one). Empty when they have none. */
  resumeText: string;
  resume: ResumeContent | null;
  /** Their Career Profile, for what the resume leaves out. */
  careerContext: string;
}

/** The person's resume and profile, as an interviewer would read them. */
export async function loadInterviewMaterial(userId: string, profileId: string): Promise<InterviewMaterial> {
  const [row, careerContext] = await Promise.all([
    prisma.resume.findFirst({
      where: { profileId },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: { content: true },
    }),
    buildCareerContext(userId),
  ]);
  const parsed = row ? resumeContentSchema.safeParse(row.content) : null;
  const resume = parsed && parsed.success ? parsed.data : null;
  return { resume, resumeText: resume ? resumeToText(resume) : "", careerContext };
}

export function resumeToText(r: ResumeContent): string {
  const lines: string[] = [];
  if (r.summary) lines.push(`Summary: ${r.summary}`);
  if (r.experience.length) {
    lines.push("Experience:");
    for (const e of r.experience.slice(0, 8)) {
      const when = [e.startDate, e.isCurrent ? "present" : e.endDate].filter(Boolean).join(" to ");
      lines.push(`- ${e.title || "Role"} at ${e.company || "a company"}${when ? ` (${when})` : ""}`);
      for (const b of e.bullets.slice(0, 6)) lines.push(`  • ${b}`);
    }
  }
  if (r.education.length) {
    lines.push("Education:");
    for (const ed of r.education.slice(0, 4)) {
      lines.push(`- ${[ed.degree, ed.fieldOfStudy].filter(Boolean).join(" in ") || "Studied"} at ${ed.school}${ed.endDate ? ` (${ed.endDate})` : ""}`);
    }
  }
  if (r.skills.length) lines.push(`Skills: ${r.skills.slice(0, 40).join(", ")}`);
  if (r.certifications.length) lines.push(`Certifications: ${r.certifications.map((c) => c.name).join(", ")}`);
  return lines.join("\n").slice(0, 6000);
}

const focusSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  kind: z.enum(["project", "claim", "skill", "gap", "motivation", "role", "behavioral"]).catch("project"),
  why: z.string().trim().max(300).catch(""),
  evidence: z.string().trim().max(300).catch(""),
  angles: z.array(z.string().trim().max(200)).max(4).catch([]),
});

const planSchema = z.object({
  summary: z.string().trim().max(500).catch(""),
  focusAreas: z.array(focusSchema).min(3).max(8),
  strengths: z.array(z.string().trim().max(160)).max(4).catch([]),
  watchOuts: z.array(z.string().trim().max(160)).max(4).catch([]),
});

/** Reads the resume (and job) into a plan. Never fails: if the AI can't answer, the plan is built from the
    resume directly. */
export async function buildInterviewPlan(
  material: InterviewMaterial,
  jobContext: string | null,
  typeLabel: string
): Promise<InterviewPlan> {
  const source = material.resumeText || material.careerContext;
  const system = `You are a senior interviewer preparing to interview one candidate. Read their resume${jobContext ? " and the job they are interviewing for" : ""} and plan the interview: what you will ask about and why.
The interview style is: ${typeLabel}.
Ground every item ONLY in the resume and profile given${jobContext ? " and the job description" : ""}. Never invent employers, projects, numbers or skills.
Pick 5 to 7 focus areas, most important first. Mix:
- "project": a specific project or piece of work on the resume worth a deep-dive (name it as the resume does)
- "claim": a result or number the resume states that a good interviewer would check ("cut latency 40%": how was it measured, what did they personally do)
- "skill": a skill the ${jobContext ? "job requires" : "candidate's level needs"} that the resume shows only lightly or not at all
- "gap": a gap, short stint, career change or level jump worth a respectful question (only if the resume shows one)
- "role": what the target role's day-to-day will demand${jobContext ? " (from the job description)" : ""}
- "behavioral": a situation type their history suggests (conflict, leading, failure, ambiguity)
- "motivation": why this move, why this kind of role
For each: topic (short), kind, why (one sentence: why ask), evidence (the resume line it comes from, quoted or closely paraphrased; empty for "skill" not on the resume), angles (2-3 short question angles).
Also: summary (2 sentences on who this candidate is), strengths (up to 3 short items), watchOuts (up to 3 short items the candidate should be ready for).
Reply with ONLY a JSON object: {"summary": "", "focusAreas": [{"topic": "", "kind": "", "why": "", "evidence": "", "angles": [""]}], "strengths": [""], "watchOuts": [""]}`;
  const prompt = `Resume:\n${source || "(no resume or profile yet)"}${
    material.resumeText ? `\n\nCareer Profile (for anything the resume leaves out):\n${material.careerContext.slice(0, 2500)}` : ""
  }${jobContext ? `\n\nJob they are interviewing for:\n${jobContext.slice(0, 3000)}` : ""}\n\nPlan the interview.`;

  const res = await generateJson({ system, prompt, maxTokens: 1400 }, planSchema);
  if (!res.ok) return fallbackPlan(material.resume, jobContext);
  return {
    source: "ai",
    summary: res.value.summary,
    strengths: res.value.strengths,
    watchOuts: res.value.watchOuts,
    focusAreas: res.value.focusAreas.map((f, i) => ({ id: `f${i + 1}`, ...f })),
  };
}
