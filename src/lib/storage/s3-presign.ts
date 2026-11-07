import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature V4 query-string signing for S3-compatible storage (Railway buckets), with no SDK: a GET link
 * to hand a visitor a private file for a few minutes, or a PUT link to upload one. Path-style or virtual-host
 * URLs; region "auto" works for Railway.
 */

export interface S3Config {
  endpoint: string; // e.g. https://t3.storageapi.dev
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  virtualHost?: boolean;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const hmac = (key: Buffer | string, s: string) => createHmac("sha256", key).update(s, "utf8").digest();

/** RFC 3986 encoding as S3 expects; "/" kept in object keys. */
function uriEncode(s: string, keepSlash = false) {
  return Array.from(Buffer.from(s, "utf8"))
    .map((b) => {
      const c = String.fromCharCode(b);
      if (/[A-Za-z0-9\-._~]/.test(c) || (keepSlash && c === "/")) return c;
      return `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    })
    .join("");
}

export function presignS3(
  cfg: S3Config,
  opts: { method: "GET" | "PUT"; key: string; expiresSeconds?: number; now?: Date; query?: Record<string, string> }
): string {
  const now = opts.now ?? new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const endpoint = new URL(cfg.endpoint);
  const host = cfg.virtualHost ? `${cfg.bucket}.${endpoint.host}` : endpoint.host;
  const path = cfg.virtualHost ? `/${uriEncode(opts.key, true)}` : `/${uriEncode(cfg.bucket)}/${uriEncode(opts.key, true)}`;
  const scope = `${day}/${cfg.region}/s3/aws4_request`;

  const params: Record<string, string> = {
    ...(opts.query ?? {}),
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(Math.min(604800, Math.max(1, Math.round(opts.expiresSeconds ?? 300)))),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(params[k])}`)
    .join("&");
  const canonicalRequest = [opts.method, path, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, day), cfg.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  return `${endpoint.protocol}//${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** The downloads bucket, from the variables Railway links to it; null when not set up. */
export function downloadsBucket(env: Record<string, string | undefined> = process.env): S3Config | null {
  const { DOWNLOADS_BUCKET_ENDPOINT, DOWNLOADS_BUCKET, DOWNLOADS_BUCKET_REGION, DOWNLOADS_ACCESS_KEY_ID, DOWNLOADS_SECRET_ACCESS_KEY } = env;
  if (!DOWNLOADS_BUCKET_ENDPOINT || !DOWNLOADS_BUCKET || !DOWNLOADS_ACCESS_KEY_ID || !DOWNLOADS_SECRET_ACCESS_KEY) return null;
  return {
    endpoint: DOWNLOADS_BUCKET_ENDPOINT,
    bucket: DOWNLOADS_BUCKET,
    region: DOWNLOADS_BUCKET_REGION || "auto",
    accessKeyId: DOWNLOADS_ACCESS_KEY_ID,
    secretAccessKey: DOWNLOADS_SECRET_ACCESS_KEY,
    virtualHost: env.DOWNLOADS_BUCKET_PATH_STYLE !== "true",
  };
}

/** The desktop installers, by short name. */
export const COMPANION_FILES = {
  mac: { key: "companion/CareerOS-Interview-Companion-mac-apple-silicon.dmg", filename: "CareerOS Interview Companion (Apple Silicon).dmg" },
  "mac-intel": { key: "companion/CareerOS-Interview-Companion-mac-intel.dmg", filename: "CareerOS Interview Companion (Intel).dmg" },
  windows: { key: "companion/CareerOS-Interview-Companion-Setup.exe", filename: "CareerOS Interview Companion Setup.exe" },
} as const;
export type CompanionPlatform = keyof typeof COMPANION_FILES;
