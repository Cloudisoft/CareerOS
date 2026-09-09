import "server-only";
import { prisma } from "@/lib/prisma";
import type { ResumeContent } from "@/lib/validations/resume";

export interface AtsScanResult {
  score: number;
  keywordScore: number;
  formatScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

const WEIGHTS = { keyword: 0.7, format: 0.3 };

function resumeToText(content: ResumeContent) {
  return [
    content.summary,
    ...content.experience.flatMap((e) => [e.title, e.company, ...e.bullets]),
    ...content.skills,
    ...content.certifications.map((c) => c.name),
  ]
    .join(" \n ")
    .toLowerCase();
}

function scoreFormat(content: ResumeContent) {
  const checks = [
    Boolean(content.summary && content.summary.trim().length > 20),
    content.experience.length > 0,
    content.experience.length > 0 && content.experience.every((e) => e.bullets.length > 0),
    content.skills.length >= 5,
    Boolean(content.links.linkedin || content.links.portfolio || content.links.github),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

/**
 * Career OS ATS methodology: keyword coverage against the platform's skill
 * dictionary (the same vocabulary the matching engine and job postings use),
 * plus a structural-completeness check. This is a real, disclosed heuristic
 * — an estimate of ATS keyword parsing, not a guarantee of any specific
 * vendor's actual scoring.
 */
export async function computeAtsScore(content: ResumeContent, jobDescription: string): Promise<AtsScanResult> {
  const allSkills = await prisma.skill.findMany({ select: { name: true } });
  const jdLower = jobDescription.toLowerCase();

  const jdKeywords = allSkills.map((s) => s.name).filter((name) => jdLower.includes(name.toLowerCase()));
  const resumeText = resumeToText(content);
  const resumeSkillsLower = content.skills.map((s) => s.toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of jdKeywords) {
    const lower = keyword.toLowerCase();
    if (resumeSkillsLower.includes(lower) || resumeText.includes(lower)) matched.push(keyword);
    else missing.push(keyword);
  }

  const keywordScore = jdKeywords.length === 0 ? 70 : Math.round((matched.length / jdKeywords.length) * 100);
  const formatScore = scoreFormat(content);
  const score = Math.round(keywordScore * WEIGHTS.keyword + formatScore * WEIGHTS.format);

  const recommendations: string[] = [];
  if (missing.length) recommendations.push(`Add these keywords if they genuinely apply: ${missing.slice(0, 8).join(", ")}`);
  if (!content.summary || content.summary.trim().length <= 20) recommendations.push("Add a professional summary — many ATS parsers weight it heavily.");
  if (content.experience.some((e) => e.bullets.length === 0)) recommendations.push("Add bullet points to every experience entry — a title and company alone parse poorly.");
  if (content.skills.length < 5) recommendations.push("List at least 5-8 skills so keyword matching has something to find.");
  if (!content.links.linkedin && !content.links.portfolio && !content.links.github) recommendations.push("Add a LinkedIn, portfolio, or GitHub link.");

  return { score, keywordScore, formatScore, matchedKeywords: matched, missingKeywords: missing, recommendations };
}
