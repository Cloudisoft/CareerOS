import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { rateLimit } from "@/lib/rate-limit";
import { candidateResumeDocument, resumePlainText } from "@/lib/resume/candidate-document";
import type { AtsCategory } from "@prisma/client";
import { EnterpriseError, requireFeature, type RecruiterContext } from "./account";
import { discoverableProfile, hasFullAccess } from "./candidates";

/**
 * AI ATS screening: scores a resume against one of the firm's jobs. The
 * score and category only ever come from a real AI response — when no AI
 * provider is configured, or the response can't be parsed, this fails
 * with AI_UNAVAILABLE rather than inventing a result.
 */

export const ATS_CRITERIA = [
  "skills",
  "experience",
  "education",
  "employment",
  "technical",
  "location",
  "salary",
  "relevance",
] as const;
export type AtsCriterion = (typeof ATS_CRITERIA)[number];

export function categoryForScore(score: number): AtsCategory {
  if (score >= 85) return "HIGHLY_QUALIFIED";
  if (score >= 70) return "QUALIFIED";
  if (score >= 50) return "POTENTIAL_MATCH";
  return "NOT_SUITABLE";
}

export interface AtsAiResult {
  score: number;
  breakdown: Record<AtsCriterion, number>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendations: string[];
}

function stripCodeFence(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
}

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n))));
const strings = (v: unknown, max = 8) =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 300)).slice(0, max) : [];

/** Validates the model's JSON. Exported for tests. Throws on anything malformed. */
export function parseAtsResponse(text: string): AtsAiResult {
  const raw = JSON.parse(stripCodeFence(text)) as Record<string, unknown>;
  const b = (raw.breakdown ?? {}) as Record<string, unknown>;
  const breakdown = {} as Record<AtsCriterion, number>;
  for (const c of ATS_CRITERIA) {
    if (b[c] == null || Number.isNaN(Number(b[c]))) throw new Error(`missing ${c}`);
    breakdown[c] = clamp(b[c]);
  }
  if (raw.score == null || Number.isNaN(Number(raw.score))) throw new Error("missing score");
  const summary = typeof raw.summary === "string" ? raw.summary.trim().slice(0, 1200) : "";
  if (!summary) throw new Error("missing summary");
  return {
    score: clamp(raw.score),
    breakdown,
    summary,
    strengths: strings(raw.strengths),
    weaknesses: strings(raw.weaknesses),
    missingSkills: strings(raw.missingSkills, 15),
    recommendations: strings(raw.recommendations),
  };
}

const SYSTEM = `You are an applicant tracking system used by professional recruiters. Evaluate how well a candidate's resume fits a job description.
Score each criterion from 0 to 100 based ONLY on evidence in the resume and the job description. Never assume experience that is not written. If the job states no requirement for a criterion (e.g. no salary or location), score it 70 and say so in the summary.
Criteria: skills (required skills present), experience (years and level), education, employment (career progression and history stability), technical (tools and technical depth), location (location / remote fit), salary (expectation vs. offered range), relevance (overall relevance of past roles).
"score" is your overall weighted fit, 0-100.
Respond with ONLY JSON, no prose, in exactly this shape:
{"score":0,"breakdown":{"skills":0,"experience":0,"education":0,"employment":0,"technical":0,"location":0,"salary":0,"relevance":0},"summary":"2-4 sentences","strengths":["..."],"weaknesses":["..."],"missingSkills":["..."],"recommendations":["next steps for the recruiter"]}`;

async function jobForFirm(ctx: RecruiterContext, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: ctx.company.id, deletedAt: null },
    include: { skills: { include: { skill: true } } },
  });
  if (!job) throw new EnterpriseError("This job could not be found.", "NOT_FOUND");
  return job;
}

function jobText(job: Awaited<ReturnType<typeof jobForFirm>>) {
  const salary =
    job.salaryMin || job.salaryMax ? `${job.salaryCurrency} ${job.salaryMin ?? "?"}-${job.salaryMax ?? "?"}` : "not stated";
  return [
    `Title: ${job.title}`,
    `Location: ${job.location ?? "not stated"} (${job.workplaceType})`,
    `Employment type: ${job.employmentType}`,
    `Level: ${job.careerLevel ?? "not stated"}`,
    `Salary: ${salary}`,
    `Required skills: ${job.skills.filter((s) => s.required).map((s) => s.skill.name).join(", ") || "not listed"}`,
    `Nice-to-have skills: ${job.skills.filter((s) => !s.required).map((s) => s.skill.name).join(", ") || "none"}`,
    "",
    job.description.slice(0, 8000),
  ].join("\n");
}

export interface ScreenInput {
  jobId: string;
  /** A CareerOS candidate the firm can see in full (applied, or unlocked). */
  candidateProfileId?: string;
  /** Or a resume the recruiter pastes in (e.g. received by email). */
  resumeText?: string;
  candidateName?: string;
}

export async function screenCandidate(ctx: RecruiterContext, input: ScreenInput) {
  requireFeature(ctx.state, "atsScreening", "AI ATS screening");
  const limit = rateLimit(`ats:${ctx.user.id}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) throw new EnterpriseError("You've run a lot of screenings this hour. Try again shortly.", "RATE_LIMITED");

  const job = await jobForFirm(ctx, input.jobId);

  let resumeText: string;
  let candidateName: string;
  let candidateProfileId: string | null = null;
  if (input.candidateProfileId) {
    const profile = await discoverableProfile(ctx, input.candidateProfileId);
    if (!(await hasFullAccess(ctx, profile.id))) {
      throw new EnterpriseError("Unlock this candidate (or wait for them to apply) before screening their resume.", "LOCKED");
    }
    const { doc } = await candidateResumeDocument(profile.user, profile.id, profile.location);
    resumeText = resumePlainText(doc);
    candidateName = `${profile.user.firstName} ${profile.user.lastName}`;
    candidateProfileId = profile.id;
  } else {
    resumeText = (input.resumeText ?? "").trim();
    candidateName = (input.candidateName ?? "").trim() || "Pasted resume";
    if (resumeText.length < 80) throw new EnterpriseError("Paste the full resume text to screen it.", "VALIDATION_ERROR");
  }

  let result: AtsAiResult;
  let provider: string;
  try {
    const res = await generateText({
      system: SYSTEM,
      prompt: `JOB DESCRIPTION\n${jobText(job)}\n\nCANDIDATE RESUME\n${resumeText.slice(0, 12000)}`,
      maxTokens: 1200,
      effort: "low",
    });
    provider = res.provider;
    if (provider === "mock") {
      throw new EnterpriseError("AI screening isn't available right now: no AI provider is configured.", "AI_UNAVAILABLE");
    }
    result = parseAtsResponse(res.text);
  } catch (error) {
    if (error instanceof EnterpriseError) throw error;
    console.error("ATS screening failed", error);
    throw new EnterpriseError("The AI couldn't complete this screening. Nothing was saved — please try again.", "AI_UNAVAILABLE");
  }

  return prisma.atsScreening.create({
    data: {
      accountId: ctx.state.account!.id,
      jobId: job.id,
      candidateProfileId,
      candidateName,
      score: result.score,
      category: categoryForScore(result.score),
      summary: result.summary,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      missingSkills: result.missingSkills,
      recommendations: result.recommendations,
      breakdown: result.breakdown,
      model: provider,
      createdById: ctx.user.id,
    },
  });
}

export async function listScreenings(ctx: RecruiterContext, filters: { jobId?: string; category?: AtsCategory }) {
  if (!ctx.state.account) return [];
  return prisma.atsScreening.findMany({
    where: {
      accountId: ctx.state.account.id,
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    include: { job: { select: { id: true, title: true } } },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}
