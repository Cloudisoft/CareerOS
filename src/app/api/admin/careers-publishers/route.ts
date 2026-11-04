import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listPublishers, grantPublisher, revokePublisher } from "@/lib/careers/service";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({ publishers: await listPublishers() });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { email } = z.object({ email: z.string().trim().email() }).parse(await req.json());
    const publisher = await grantPublisher(user.id, email);
    await writeAuditLog({ userId: user.id, action: "careers.publisher.granted", targetType: "user", targetId: publisher.userId, ipAddress: ipFromRequest(req) });
    return apiOk({ publisher });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { userId } = z.object({ userId: z.string().min(1) }).parse(await req.json());
    await revokePublisher(userId);
    await writeAuditLog({ userId: user.id, action: "careers.publisher.revoked", targetType: "user", targetId: userId, ipAddress: ipFromRequest(req) });
    return apiOk({ revoked: true });
  } catch (error) {
    return apiCatch(error);
  }
}
