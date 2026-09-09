import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { updateApplicationStatusForCompany } from "@/lib/employer/applications";
import { applicationStatusUpdateSchema } from "@/lib/validations/employer";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    const { status, note } = applicationStatusUpdateSchema.parse(await req.json());
    const application = await updateApplicationStatusForCompany(company.id, params.id, status, note);
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}
