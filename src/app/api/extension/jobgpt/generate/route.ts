import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionUser } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";
import {
  buildExtensionPrompt,
  JOB_GPT_SYSTEM_PROMPT,
  RESUME_PARSE_SYSTEM_PROMPT,
} from "@/lib/ai/job-gpt/extension-prompts";
import { generateText } from "@/lib/ai/gateway";
import { prisma } from "@/lib/prisma";
import { extCatch, extError, extOk } from "@/lib/extension/response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  kind: z.enum(["coverLetter", "whyCompany", "parseResume", "answerQuestion"]),
  posting: z
    .object({ title: z.string().optional(), company: z.string().optional(), description: z.string().optional() })
    .optional(),
  question: z.string().optional(),
  text: z.string().optional(),
  matchedSkills: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    await requireEntitlement(user.id, "jobGpt");

    const limit = rateLimit(`ext-jobgpt:${user.id}`, 20, 60 * 1000);
    if (!limit.allowed) return extError("Too many requests in a minute — the run will retry.", 429);

    const input = schema.parse(await req.json());

    const careerContext = input.kind === "parseResume" ? "" : await buildCareerContext(user.id);
    const prompt = buildExtensionPrompt(input, careerContext);
    if (!prompt) return extError("Nothing to write", 400);

    const system = input.kind === "parseResume" ? RESUME_PARSE_SYSTEM_PROMPT : JOB_GPT_SYSTEM_PROMPT;
    const { text, provider } = await generateText({ system, prompt, maxTokens: 1500 });

    await prisma.aiUsage.create({ data: { userId: user.id, feature: `extension_${input.kind}`, provider } });

    if (/^NEEDS_HUMAN$/i.test(text.trim())) return extError("Needs you", 422);

    return extOk({ text: text.trim() });
  } catch (error) {
    return extCatch(error);
  }
}
