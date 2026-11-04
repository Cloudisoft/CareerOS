import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { candidateResumeFile } from "@/lib/enterprise/candidates";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch } from "@/lib/api-response";

/** Authenticated, firm-checked resume download — never a public URL. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireRecruiter();
    const { bytes, fileName } = await candidateResumeFile(ctx, params.id);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.resume.downloaded", targetType: "candidate_profile", targetId: params.id, metadata: { companyId: ctx.company.id }, ipAddress: ipFromRequest(req) });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
