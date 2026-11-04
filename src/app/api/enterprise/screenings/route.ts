import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { screenCandidate, listScreenings } from "@/lib/enterprise/ats";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { AtsCategory } from "@prisma/client";

const CATEGORIES = ["HIGHLY_QUALIFIED", "QUALIFIED", "POTENTIAL_MATCH", "NOT_SUITABLE"];

const schema = z
  .object({
    jobId: z.string().min(1),
    candidateProfileId: z.string().min(1).optional(),
    resumeText: z.string().max(40000).optional(),
    candidateName: z.string().trim().max(120).optional(),
  })
  .refine((v) => v.candidateProfileId || v.resumeText, { message: "Choose a candidate or paste a resume." });

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const category = req.nextUrl.searchParams.get("category");
    return apiOk({
      screenings: await listScreenings(ctx, {
        jobId: req.nextUrl.searchParams.get("jobId") || undefined,
        category: category && CATEGORIES.includes(category) ? (category as AtsCategory) : undefined,
      }),
    });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const input = schema.parse(await req.json());
    const screening = await screenCandidate(ctx, input);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.ats.screened", targetType: "ats_screening", targetId: screening.id, metadata: { jobId: input.jobId, companyId: ctx.company.id } });
    return apiOk({ screening });
  } catch (error) {
    return apiCatch(error);
  }
}
