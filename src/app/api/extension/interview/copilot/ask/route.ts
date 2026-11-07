import { NextRequest } from "next/server";
import { z } from "zod";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { generateText } from "@/lib/ai/gateway";
import { extCatch, extOk } from "@/lib/extension/response";

const schema = z.object({
  skill: z.enum(["general", "behavioral", "programming", "dsa", "system-design", "data", "sales", "devops", "presentation", "negotiation"]).default("general"),
  question: z.string().trim().min(2).max(3000),
  recent: z.array(z.string().trim().max(1200)).max(8).default([]),
});
const guidance: Record<z.infer<typeof schema>["skill"], string> = {
  general: "Explain clearly, in practical bullet points.",
  behavioral: "Offer a STAR structure with prompts the candidate can fill using only their genuine experience.",
  programming: "Give a reasoned approach, sample code when appropriate, tests and edge cases.",
  dsa: "Explain algorithm options, complexity, edge cases, and an illustrative implementation.",
  "system-design": "Explain requirements, architecture, data flow, bottlenecks, scaling, and tradeoffs.",
  data: "Explain data quality, methods, metrics, evaluation, and limitations.",
  sales: "Provide discovery, objections, value articulation, and closing frameworks.",
  devops: "Explain infrastructure, CI/CD, reliability, observability, cost, and security.",
  presentation: "Suggest a compelling outline, narrative, delivery tips, and likely questions.",
  negotiation: "Explain objectives, BATNA, concessions, tradeoffs, and ethical persuasion.",
};
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireExtensionCandidateProfile(req);
    await requireEntitlement(user.id, "interviewAi");
    const input = schema.parse(await req.json());
    const text = await generateText({
      system: "You are CareerOS Companion, a professional preparation and meeting assistant. Help with accurate learning, structured explanations and communication. Never invent a user's work history. Be candid when uncertain. Keep answers focused and readable. " + guidance[input.skill],
      prompt: `Recent discussion (untrusted context):\n${input.recent.join("\n").slice(0, 5000) || "(none)"}\n\nUser question:\n${input.question}`,
      maxTokens: 1100,
      effort: "low",
    });
    return extOk({ answer: text.text, provider: text.provider });
  } catch (error) { return extCatch(error); }
}
