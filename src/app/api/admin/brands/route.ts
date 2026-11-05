import { requirePlatformAdmin } from "@/lib/auth/guards";
import { brandCoverage, enrichCompanyBrandsNow } from "@/lib/company/branding";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

export const maxDuration = 120;

/** How many companies have a logo and banner. */
export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk(await brandCoverage());
  } catch (error) {
    return apiCatch(error);
  }
}

/** Looks up logos and banners for the next batch of companies missing them. */
export async function POST() {
  try {
    const { user } = await requirePlatformAdmin();
    const result = await enrichCompanyBrandsNow(30);
    await writeAuditLog({ userId: user.id, action: "admin.companies.brand_lookup", metadata: result });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
