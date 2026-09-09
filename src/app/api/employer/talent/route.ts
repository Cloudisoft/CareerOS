import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { searchTalent } from "@/lib/employer/talent";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { company } = await requireEmployerCompany();
    const params = req.nextUrl.searchParams;

    const people = await searchTalent(company.id, {
      q: params.get("q")?.trim() || undefined,
      location: params.get("location")?.trim() || undefined,
      careerLevel: params.get("careerLevel")?.trim() || undefined,
      skills: params.get("skills")?.split(",").filter(Boolean),
      jobId: params.get("jobId")?.trim() || undefined,
    });

    return apiOk({ people });
  } catch (error) {
    return apiCatch(error);
  }
}
