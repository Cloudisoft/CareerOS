import { NextRequest } from "next/server";
import { requireCareersPublisher, listAllListings, createListing } from "@/lib/careers/service";
import { careersListingSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requireCareersPublisher();
    return apiOk({ listings: await listAllListings() });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCareersPublisher();
    const input = careersListingSchema.parse(await req.json());
    const listing = await createListing(user.id, input);
    await writeAuditLog({ userId: user.id, action: "careers.listing.created", targetType: "careers_listing", targetId: listing.id, ipAddress: ipFromRequest(req) });
    return apiOk({ listing });
  } catch (error) {
    return apiCatch(error);
  }
}
