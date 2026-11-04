import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { pipeline, PIPELINE_STAGES } from "@/lib/enterprise/engagement";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { ApplicationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const status = req.nextUrl.searchParams.get("status");
    return apiOk({
      applications: await pipeline(ctx, {
        jobId: req.nextUrl.searchParams.get("jobId") || undefined,
        status: status && PIPELINE_STAGES.includes(status as ApplicationStatus) ? (status as ApplicationStatus) : undefined,
      }),
      stages: PIPELINE_STAGES,
    });
  } catch (error) {
    return apiCatch(error);
  }
}
