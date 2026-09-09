import { NextRequest } from "next/server";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { contactCandidate } from "@/lib/employer/talent";
import { contactCandidateSchema } from "@/lib/validations/employer";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const { company } = await requireEmployerCompany();
    const { message } = contactCandidateSchema.parse(await req.json());
    await contactCandidate(company.id, company.name, params.profileId, message);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
