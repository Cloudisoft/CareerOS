import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listDrafts, generateDraft } from "@/lib/outreach/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const generateSchema = z.object({
  channel: z.enum(["email", "linkedin"]),
  jobId: z.string().trim().min(1).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactRole: z.string().trim().max(160).optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const drafts = await listDrafts(profile.id);
    return apiOk({ drafts });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "coverLetterStudio");
    const input = generateSchema.parse(await req.json());
    const draft = await generateDraft(user.id, profile.id, input);
    return apiOk({ draft });
  } catch (error) {
    return apiCatch(error);
  }
}
