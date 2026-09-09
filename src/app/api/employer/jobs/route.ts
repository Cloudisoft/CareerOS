import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { createJobForCompany, listJobsForCompany } from "@/lib/employer/jobs";
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
    const { company } = await requireEmployerCompany();
    const input = jobInputSchema.parse(await req.json());
    const job = await createJobForCompany(company.id, input);
    return apiOk({ job });
  } catch (error) {
    return apiCatch(error);
  }
}
