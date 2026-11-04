import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { createAnnouncement, listAnnouncements } from "@/lib/enterprise/boosts";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(3000) });

export async function GET() {
  try {
    const ctx = await requireRecruiter();
    return apiOk({ announcements: await listAnnouncements(ctx) });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const { content } = schema.parse(await req.json());
    const post = await createAnnouncement(ctx, content);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.announcement.posted", targetType: "post", targetId: post.id });
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
