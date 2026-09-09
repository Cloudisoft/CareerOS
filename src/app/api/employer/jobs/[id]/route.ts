import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { deleteJobForCompany, getJobForCompany, setJobStatus, updateJobForCompany } from "@/lib/employer/jobs";
import { jobInputSchema, jobStatusUpdateSchema } from "@/lib/validations/employer";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    const job = await getJobForCompany(company.id, params.id);
    return apiOk({ job });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    const body = await req.json();

    if (Object.keys(body).length === 1 && "status" in body) {
      const { status } = jobStatusUpdateSchema.parse(body);
      const job = await setJobStatus(company.id, params.id, status);
      return apiOk({ job });
    }

    const input = jobInputSchema.parse(body);
    const job = await updateJobForCompany(company.id, params.id, input);
    return apiOk({ job });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    await deleteJobForCompany(company.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
