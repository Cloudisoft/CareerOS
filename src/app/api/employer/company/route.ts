import { NextRequest } from "next/server";
import { requireEmployer } from "@/lib/auth/guards";
import { createCompanyForUser, getCompanyForUser, updateCompany } from "@/lib/company/service";
import { companyInputSchema } from "@/lib/validations/employer";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user } = await requireEmployer();
    const company = await getCompanyForUser(user.id);
    return apiOk({ company });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEmployer();
    const input = companyInputSchema.parse(await req.json());
    const company = await createCompanyForUser(user.id, input);
    return apiOk({ company });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireEmployer();
    const existing = await getCompanyForUser(user.id);
    if (!existing) return apiCatch({ code: "NEEDS_COMPANY", message: "Create your company profile first." });

    const input = companyInputSchema.parse(await req.json());
    const company = await updateCompany(existing.id, input);
    return apiOk({ company });
  } catch (error) {
    return apiCatch(error);
  }
}
