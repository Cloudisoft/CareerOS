import "server-only";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";

const GROUNDING_RULE =
  "Never invent employers, dates, degrees, certifications, or achievements that aren't in the CareerContext you're given. If a detail isn't there, write around it rather than making it up.";

const EXECUTIVE_RULE =
  " Write at an executive level: board- and C-suite-appropriate language, emphasis on organizational impact over task-level detail.";

export interface GenerateCoverLetterInput {
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone?: "professional" | "enthusiastic" | "concise";
  executiveMode?: boolean;
}

export async function generateCoverLetter(input: GenerateCoverLetterInput) {
  const careerContext = await buildCareerContext(input.userId);
  const tone = input.tone ?? "professional";

  const system = `You write real, specific cover letters grounded in one candidate's actual background. ${GROUNDING_RULE}${
    input.executiveMode ? EXECUTIVE_RULE : ""
  } Tone: ${tone}. Three to four short paragraphs, no placeholders like "[Company Name]" — use the real company and role given. Return only the letter body — no subject line, no "Dear Hiring Manager" salutation block beyond a simple greeting, no signature block.`;

  const prompt = `CareerContext for this candidate:\n${careerContext}\n\nWrite a cover letter for this role:\nTitle: ${input.jobTitle}\nCompany: ${input.companyName}\n\nJob description:\n${input.jobDescription.slice(0, 3000)}`;

  const { text, provider } = await generateText({ system, prompt, maxTokens: 700 });
  return { text, provider };
}
