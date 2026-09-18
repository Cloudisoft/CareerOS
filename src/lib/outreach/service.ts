import "server-only";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";

export class OutreachError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export type OutreachChannel = "email" | "linkedin";

const EMAIL_SYSTEM_PROMPT = `You draft a cold outreach email for one candidate applying to or interested in a role.
Ground every claim only in the CareerContext given — never invent the candidate's experience. Never invent facts about the contact or company beyond what's given.
This is a DRAFT for the candidate to review, edit, and send themselves — you are not sending anything.
Write a short, specific, non-generic email: lead with one real, relevant thing about the candidate, reference the actual role/company, and make a clear, low-pressure ask.
Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"subject": "<email subject line>", "body": "<email body, 100-180 words, no placeholder brackets>"}`;

const LINKEDIN_SYSTEM_PROMPT = `You draft a short LinkedIn connection/outreach message for one candidate.
Ground every claim only in the CareerContext given — never invent the candidate's experience. Never invent facts about the recipient beyond what's given.
This is a DRAFT for the candidate to review, edit, and send themselves.
Keep it under 300 characters, warm, specific, and not generic — one real reason for reaching out, one clear ask.
Respond with ONLY a JSON object, no markdown code fences, no prose, in exactly this shape:
{"body": "<message, under 300 characters>"}`;

function stripCodeFence(text: string) {
  return text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

export async function listDrafts(profileId: string) {
  return prisma.outreachDraft.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true, company: { select: { name: true } } } } },
  });
}

export async function generateDraft(
  userId: string,
  profileId: string,
  input: { channel: OutreachChannel; jobId?: string; contactName?: string; contactRole?: string }
) {
  const careerContext = await buildCareerContext(userId);

  let jobLine = "No specific job attached — this is general outreach.";
  let validJobId: string | undefined;
  if (input.jobId) {
    const job = await prisma.job.findUnique({ where: { id: input.jobId }, include: { company: true } });
    if (job) {
      validJobId = job.id;
      jobLine = `Role: ${job.title} at ${job.company.name}.\nJob description:\n${job.description.slice(0, 2000)}`;
    }
  }

  const contactLine = input.contactName
    ? `Contact: ${input.contactName}${input.contactRole ? `, ${input.contactRole}` : ""}.`
    : "No contact name was given — write it addressed generically (e.g. \"Hi there\"), do not invent a name.";

  const prompt = `CareerContext:\n${careerContext}\n\n${jobLine}\n\n${contactLine}\n\nWrite the ${input.channel === "email" ? "email" : "LinkedIn message"} draft.`;

  const { text, provider } = await generateText({
    system: input.channel === "email" ? EMAIL_SYSTEM_PROMPT : LINKEDIN_SYSTEM_PROMPT,
    prompt,
    maxTokens: 500,
  });

  let subject: string | undefined;
  let body: string;
  if (provider === "mock") {
    body = "[DEV MODE — no AI provider configured. Set an AI provider key for a real draft.]";
    if (input.channel === "email") subject = "[DEV MODE]";
  } else {
    try {
      const parsed = JSON.parse(stripCodeFence(text)) as { subject?: string; body: string };
      if (!parsed?.body) throw new Error("empty");
      body = parsed.body;
      subject = parsed.subject;
    } catch {
      throw new OutreachError("The AI provider returned an unexpected response. Please try again.", "AI_PARSE_ERROR");
    }
  }

  return prisma.outreachDraft.create({
    data: {
      profileId,
      jobId: validJobId,
      channel: input.channel,
      contactName: input.contactName || null,
      contactRole: input.contactRole || null,
      subject: subject || null,
      body,
    },
    include: { job: { select: { title: true, company: { select: { name: true } } } } },
  });
}
