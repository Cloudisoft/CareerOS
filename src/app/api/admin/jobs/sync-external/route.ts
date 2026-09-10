import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { syncExternalJobsSchema } from "@/lib/validations/jobs-sync";
import { syncExternalJobs } from "@/lib/jobs/external/sync";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { queries, country } = syncExternalJobsSchema.parse(await req.json());
    const results = await syncExternalJobs(queries, { country });
    return apiOk({ results });
  } catch (error) {
    return apiCatch(error);
  }
}
