import "server-only";
import { generateText } from "@/lib/ai/gateway";
import { resumeContentSchema, type ResumeContent } from "@/lib/validations/resume";

const GROUNDING_RULE =
  "Never invent employers, dates, degrees, certifications, numbers, or achievements that aren't already stated in what you're given. If asked to quantify something with no basis for a number, rephrase for impact without fabricating a metric.";

/** Elite's "Executive Resume Optimization" — same real AI tools, an executive-caliber editorial bar. */
const EXECUTIVE_RULE =
  " Write at an executive level: board- and C-suite-appropriate language, emphasis on scope, scale, and strategic impact over task-level detail.";

export async function rewriteResumeBullet(input: {
  bullet: string;
  jobTitle?: string;
  jobDescription?: string;
  executiveMode?: boolean;
}) {
  const system = `You rewrite resume bullet points to be concise, impact-first, and quantified where the input already supports it. ${GROUNDING_RULE}${
    input.executiveMode ? EXECUTIVE_RULE : ""
  } Return only the rewritten bullet — no preamble, no quotes, no bullet character.`;

  const context = input.jobDescription
    ? `\n\nTailor the phrasing (not the facts) toward this target role:\nTitle: ${input.jobTitle ?? "unknown"}\n${input.jobDescription.slice(0, 2000)}`
    : "";

  const { text, provider } = await generateText({
    system,
    prompt: `Rewrite this resume bullet:\n"${input.bullet}"${context}`,
    maxTokens: 300,
  });

  return { text, provider };
}

const PARSE_SYSTEM_PROMPT =
  "You extract structured resume data as JSON. You return one JSON object and nothing else — no prose, no code fences. You never invent a fact that is not in the source text; leave a field empty when the resume doesn't say.";

export class ResumeParseError extends Error {}

/** Turns raw extracted resume text into the same ResumeContent shape the editor uses. */
export async function parseResumeToContent(text: string): Promise<ResumeContent> {
  const prompt = `Read this resume and return its content as JSON matching exactly this shape:
{"summary":"","links":{"linkedin":"","github":"","portfolio":""},"experience":[{"title":"","company":"","location":"","startDate":"","endDate":"","isCurrent":false,"bullets":[""]}],"education":[{"school":"","degree":"","fieldOfStudy":"","startDate":"","endDate":""}],"skills":[""],"certifications":[{"name":"","issuer":"","year":""}]}

Write "summary" in the candidate's first person, two to three sentences, from whatever summary/objective text the resume has (or synthesize briefly from their most recent role if it has none). Dates can stay in whatever format the resume uses (e.g. "Jan 2021"). Set isCurrent true only when the resume says "present"/"current". Do not include contact details (name, email, phone, address) — only the fields in the shape above.

Resume:
${text.slice(0, 12000)}`;

  const { text: raw } = await generateText({
    system: PARSE_SYSTEM_PROMPT,
    prompt,
    maxTokens: 2000,
  });

  const jsonText = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ResumeParseError("Couldn't read that resume. Try a different file, or paste your details manually.");
  }

  return resumeContentSchema.parse(parsed);
}

export async function improveResumeSummary(input: {
  currentSummary?: string;
  headline?: string;
  currentTitle?: string;
  topSkills?: string[];
  jobDescription?: string;
  executiveMode?: boolean;
}) {
  const system = `You write concise, first-person resume summaries (2-3 sentences). ${GROUNDING_RULE}${
    input.executiveMode ? EXECUTIVE_RULE : ""
  } Return only the summary text — no preamble, no quotes.`;

  const facts = [
    input.currentTitle ? `Current title: ${input.currentTitle}` : "",
    input.headline ? `Headline: ${input.headline}` : "",
    input.topSkills?.length ? `Key skills: ${input.topSkills.join(", ")}` : "",
    input.currentSummary ? `Existing summary to improve: "${input.currentSummary}"` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const context = input.jobDescription
    ? `\n\nTailor the emphasis (not the facts) toward this target role:\n${input.jobDescription.slice(0, 2000)}`
    : "";

  const { text, provider } = await generateText({
    system,
    prompt: `Candidate facts:\n${facts || "No details provided."}${context}\n\nWrite the summary.`,
    maxTokens: 300,
  });

  return { text, provider };
}
