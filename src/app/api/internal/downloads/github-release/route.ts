import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCompanionReleaseIdentity } from "@/lib/companion/github-uploader-token";
import { COMPANION_FILES, downloadsBucket, presignS3 } from "@/lib/storage/s3-presign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const payload = z.object({ platform: z.enum(["mac", "mac-intel", "windows"]) });
const noStore = { "Cache-Control": "no-store" };

/** Short-lived S3 PUT URL, only to our own GitHub main-branch release workflow. */
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization") || "";
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/.exec(bearer);
  if (!match) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const input = payload.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid platform" }, { status: 422, headers: noStore });
  const bucket = downloadsBucket();
  if (!bucket) return NextResponse.json({ error: "Storage unavailable" }, { status: 503, headers: noStore });

  try {
    const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", {
      signal: AbortSignal.timeout(7000), cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to verify upload identity");
    const keys = await response.json() as { keys?: Array<Record<string, unknown>> };
    if (!verifyCompanionReleaseIdentity(match[1], keys)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
    }
  } catch {
    return NextResponse.json({ error: "Release identity verification unavailable" }, { status: 503, headers: noStore });
  }

  const target = COMPANION_FILES[input.data.platform];
  const url = presignS3(bucket, { method: "PUT", key: target.key, expiresSeconds: 300 });
  return NextResponse.json({ url, platform: input.data.platform }, { headers: noStore });
}
