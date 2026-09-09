import "server-only";
import { generateText } from "@/lib/ai/gateway";

const GROUNDING_RULE =
  "Never invent employers, dates, degrees, certifications, numbers, or achievements that aren't already stated in what you're given. If asked to quantify something with no basis for a number, rephrase for impact without fabricating a metric.";

export async function rewriteResumeBullet(input: { bullet: string; jobTitle?: string; jobDescription?: string }) {
  const system = `You rewrite resume bullet points to be concise, impact-first, and quantified where the input already supports it. ${GROUNDING_RULE} Return only the rewritten bullet — no preamble, no quotes, no bullet character.`;

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

export async function improveResumeSummary(input: {
  currentSummary?: string;
  headline?: string;
  currentTitle?: string;
  topSkills?: string[];
  jobDescription?: string;
}) {
  const system = `You write concise, first-person resume summaries (2-3 sentences). ${GROUNDING_RULE} Return only the summary text — no preamble, no quotes.`;

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
