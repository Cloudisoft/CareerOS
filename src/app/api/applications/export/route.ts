import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { exportApplicationsCsv } from "@/lib/applications/service";
import { apiCatch } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const csv = await exportApplicationsCsv(profile.id);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="careeros-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
