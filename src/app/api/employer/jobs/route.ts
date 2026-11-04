import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { createJobForCompany, listJobsForCompany, resolveSkillIds } from "@/lib/employer/jobs";
import { requireRecruiter, postJobWithinQuota } from "@/lib/enterprise/account";
import { writeAuditLog } from "@/lib/audit/log";
import { jobInputSchema } from "@/lib/validations/employer";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { company } = await requireEmployerCompany();
    const jobs = await listJobsForCompany(company.id);
    return apiOk({ jobs });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const input = jobInputSchema.parse(await req.json());
    const skillIds = await resolveSkillIds(input.skills);
    // Formal job posting is an Enterprise feature with a daily quota (trial: 1/day).
    const job = await postJobWithinQuota(ctx, (tx) => createJobForCompany(ctx.company.id, input, { db: tx, skillIds }));
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.job.posted", targetType: "Job", targetId: job.id });
    return apiOk({ job });
  } catch (error) {
    return apiCatch(error);
  }
}
