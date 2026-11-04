import { requireRecruiter } from "@/lib/enterprise/account";
import { dashboardStats } from "@/lib/enterprise/dashboard";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const ctx = await requireRecruiter();
    return apiOk(await dashboardStats(ctx));
  } catch (error) {
    return apiCatch(error);
  }
}
