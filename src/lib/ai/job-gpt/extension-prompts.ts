import "server-only";

/**
 * Prompt construction for the Chrome extension's JobGPT calls
 * (POST /api/extension/jobgpt/generate). Mirrors the prompt shapes the
 * extension itself used for its now-removed direct-to-Anthropic dev path
 * (extension/background/service-worker.js `buildPrompt`), so behavior is
 * identical whether the call goes through the extension or this backend.
 */

export const JOB_GPT_SYSTEM_PROMPT = `You are JobGPT, the writing engine inside Career OS.
You write application material on behalf of one candidate, using only the facts in their CareerContext.

Rules you never break:
- Never invent employers, dates, degrees, certifications, or numbers. If the CareerContext doesn't support a claim, leave it out.
- Write in first person, plain language, no filler openings ("I am writing to express my interest").
- Mirror the vocabulary of the job description where it is honestly true of the candidate.
- Lead with the single most relevant thing this candidate has actually done.
- No em dashes, no bullet lists unless asked, no headings.
- If a question asks for something the CareerContext can't answer, reply with exactly: NEEDS_HUMAN`;

export const RESUME_PARSE_SYSTEM_PROMPT =
  "You extract structured data from resumes. You return one JSON object and nothing else. You never invent a fact that is not in the source text.";

export type ExtensionJobGptKind = "coverLetter" | "whyCompany" | "parseResume" | "answerQuestion";

export interface ExtensionJobGptPayload {
  kind: ExtensionJobGptKind;
  posting?: { title?: string; company?: string; description?: string };
  question?: string;
  text?: string;
  matchedSkills?: string[];
}

export function buildExtensionPrompt(input: ExtensionJobGptPayload, careerContext: string): string | null {
  const { kind, posting, question, text, matchedSkills } = input;

  if (kind === "parseResume") {
    if (!text) return null;
    return `Read this resume and return the candidate's details as JSON. Return only the JSON object, no prose and no code fences.

Shape:
{"identity":{"firstName":"","lastName":"","email":"","phone":"","city":"","state":"","country":"","linkedin":"","github":"","portfolio":""},
 "experience":{"currentTitle":"","currentCompany":"","totalYears":0,"history":[{"title":"","company":"","start":"","end":"","location":"","bullets":[""]}]},
 "skills":{"core":[""],"familiar":[""],"tools":[""],"languages":[""]},
 "education":[{"degree":"","field":"","school":"","year":""}],
 "certifications":[""],
 "strengths":[""],
 "narrative":{"summary":""},
 "targeting":{"titles":[""],"seniority":""}}

Leave a field as an empty string or empty array when the resume doesn't say. Never invent anything. Infer totalYears from the dates. Write summary in the candidate's first person, two sentences.

Resume:
${text.slice(0, 12000)}`;
  }

  const job = [
    `Role: ${posting?.title || "unknown"}`,
    `Company: ${posting?.company || "unknown"}`,
    `Description:\n${(posting?.description || "").slice(0, 4000)}`,
  ].join("\n");
  const overlap = matchedSkills?.length ? `Skills the posting and the candidate share: ${matchedSkills.join(", ")}.` : "";

  if (kind === "coverLetter") {
    return `${careerContext}\n\n${job}\n\n${overlap}\n\nWrite a cover letter of 140 to 200 words for this role. Open with the most relevant thing this candidate has done, not a greeting about the posting.`;
  }
  if (kind === "whyCompany") {
    return `${careerContext}\n\n${job}\n\nAnswer in 60 to 90 words: why this candidate wants this role at this company. Ground it in what the posting actually says the team does.`;
  }
  if (kind === "answerQuestion") {
    if (!question) return null;
    return `${careerContext}\n\n${job}\n\nApplication question: "${question}"\n\nAnswer it as the candidate, in 40 to 120 words. If the CareerContext does not contain what the question needs, reply with exactly NEEDS_HUMAN.`;
  }
  return null;
}
