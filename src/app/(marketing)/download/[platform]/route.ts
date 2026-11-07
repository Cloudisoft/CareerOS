import { NextRequest, NextResponse } from "next/server";
import { COMPANION_FILES, downloadsBucket, presignS3, type CompanionPlatform } from "@/lib/storage/s3-presign";

export const dynamic = "force-dynamic";

/**
 * /download/mac, /download/mac-intel, /download/windows: sends the visitor to a 10-minute signed link for the
 * installer in the private Railway "downloads" bucket.
 */
export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const file = COMPANION_FILES[params.platform as CompanionPlatform];
  const bucket = downloadsBucket();
  if (!file || !bucket) return NextResponse.redirect(new URL("/download", req.url), 302);
  const url = presignS3(bucket, {
    method: "GET",
    key: file.key,
    expiresSeconds: 600,
    query: { "response-content-disposition": `attachment; filename="${file.filename}"` },
  });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
