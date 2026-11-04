import { NextRequest } from "next/server";
import { requireCareersPublisher, updateListing, deleteListing } from "@/lib/careers/service";
import { careersListingSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCareersPublisher();
    const input = careersListingSchema.partial().parse(await req.json());
    const listing = await updateListing(params.id, input);
    await writeAuditLog({ userId: user.id, action: "careers.listing.updated", targetType: "careers_listing", targetId: params.id, metadata: { fields: Object.keys(input) }, ipAddress: ipFromRequest(req) });
    return apiOk({ listing });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCareersPublisher();
    await deleteListing(params.id);
    await writeAuditLog({ userId: user.id, action: "careers.listing.deleted", targetType: "careers_listing", targetId: params.id, ipAddress: ipFromRequest(req) });
    return apiOk({ deleted: true });
  } catch (error) {
    return apiCatch(error);
  }
}
