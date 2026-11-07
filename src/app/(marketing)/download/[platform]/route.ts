import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { companionAccess } from "@/lib/companion/access";
import { COMPANION_FILES, downloadsBucket, presignS3, type CompanionPlatform } from "@/lib/storage/s3-presign";

export const dynamic = "force-dynamic";

/**
 * Download authorization is enforced at the server, not only by hiding page buttons.
 * A valid CANDIDATE session with a current Interview AI entitlement is required to
 * obtain a short-lived signed Railway bucket URL. Do not host public installers or
 * expose direct NEXT_PUBLIC_COMPANION URLs to bypass this check.
 */
export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const platform = params.platform as CompanionPlatform;
  const file = Object.prototype.hasOwnProperty.call(COMPANION_FILES, platform)
    ? COMPANION_FILES[platform]
    : null;
  if (!file) return new NextResponse("Not found", { status: 404 });

  const noStore = { "Cache-Control": "private, no-store, max-age=0" };
  const user = await getSessionUser();
  if (companionAccess(user?.role, false) === "login") {
    const login = new URL("/login", req.url);
    login.searchParams.set("as", "CANDIDATE");
    login.searchParams.set("next", `/download/${platform}`);
    return NextResponse.redirect(login, { status: 303, headers: noStore });
  }

  if (!user || companionAccess(user.role, false) === "candidate-only") {
    return NextResponse.redirect(new URL("/download?error=candidate-only", req.url), { status: 303, headers: noStore });
  }

  const entitlements = await getEntitlements(user.id);
  if (companionAccess(user.role, entitlements.interviewAi === true) !== "allowed") {
    return NextResponse.redirect(new URL("/download?upgrade=interview-ai", req.url), { status: 303, headers: noStore });
  }

  const bucket = downloadsBucket();
  if (!bucket) return NextResponse.redirect(new URL("/download?error=unavailable", req.url), { status: 303, headers: noStore });

  const url = presignS3(bucket, {
    method: "GET",
    key: file.key,
    expiresSeconds: 120,
    query: { "response-content-disposition": `attachment; filename="${file.filename}"` },
  });
  return NextResponse.redirect(url, { status: 302, headers: noStore });
}
