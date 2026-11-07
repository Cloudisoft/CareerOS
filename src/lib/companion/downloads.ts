import { downloadsBucket } from "@/lib/storage/s3-presign";

/** Where the Interview Companion installers are: the private downloads bucket (served through
    /download/<platform>), or URLs set on the server (NEXT_PUBLIC_COMPANION_*_URL) if they're hosted elsewhere.
    An empty string means that installer isn't available yet. */
export function installerUrls() {
  const hosted = Boolean(downloadsBucket());
  return {
    mac: process.env.NEXT_PUBLIC_COMPANION_MAC_URL || (hosted ? "/download/mac" : ""),
    macIntel: process.env.NEXT_PUBLIC_COMPANION_MAC_INTEL_URL || (hosted ? "/download/mac-intel" : ""),
    win: process.env.NEXT_PUBLIC_COMPANION_WIN_URL || (hosted ? "/download/windows" : ""),
  };
}
