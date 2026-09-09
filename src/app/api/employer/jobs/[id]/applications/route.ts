import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { listApplicationsForCompany } from "@/lib/employer/applications";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { ApplicationStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    const status = req.nextUrl.searchParams.get("status") as ApplicationStatus | null;
    const applications = await listApplicationsForCompany(company.id, {
      jobId: params.id,
      status: status ?? undefined,
    });
    return apiOk({ applications });
  } catch (error) {
    return apiCatch(error);
  }
}
