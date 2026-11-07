import { downloadsBucket } from "@/lib/storage/s3-presign";

/**
 * All installer links must pass through authenticated /download/[platform] routes.
 * Never expose NEXT_PUBLIC_COMPANION_*_URL or a public installer URL as a fallback:
 * those bypass paid-candidate authorization.
 */
export function installerUrls() {
  const hosted = Boolean(downloadsBucket());
  return {
    mac: hosted ? "/download/mac" : "",
    macIntel: hosted ? "/download/mac-intel" : "",
    win: hosted ? "/download/windows" : "",
  };
}
