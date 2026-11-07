import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { COMPANION_FILES, downloadsBucket, presignS3 } from "@/lib/storage/s3-presign";

export const dynamic = "force-dynamic";

/**
 * Hands out a one-hour upload link for a desktop installer, so a new build can be put in the private
 * downloads bucket. Locked by DOWNLOADS_UPLOAD_TOKEN (at least 32 characters): set it on the server only while
 * uploading, then remove it, which switches this off.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.DOWNLOADS_UPLOAD_TOKEN ?? "";
  const given = req.headers.get("x-upload-token") ?? "";
  const ok = expected.length >= 32 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bucket = downloadsBucket();
  if (!bucket) return NextResponse.json({ error: "The downloads bucket isn't connected." }, { status: 503 });
  const parsed = z.object({ platform: z.enum(["mac", "mac-intel", "windows"]) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "platform must be mac, mac-intel or windows" }, { status: 422 });
  const file = COMPANION_FILES[parsed.data.platform];
  return NextResponse.json({ key: file.key, url: presignS3(bucket, { method: "PUT", key: file.key, expiresSeconds: 3600 }) });
}
