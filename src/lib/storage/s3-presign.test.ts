import { describe, expect, it } from "vitest";
import { downloadsBucket, presignS3 } from "./s3-presign";

describe("S3 presigned links", () => {
  it("matches AWS's published SigV4 query-string example", () => {
    // docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
    const url = presignS3(
      { endpoint: "https://s3.amazonaws.com", bucket: "examplebucket", region: "us-east-1", accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", virtualHost: true },
      { method: "GET", key: "test.txt", expiresSeconds: 86400, now: new Date("2013-05-24T00:00:00Z") }
    );
    expect(url).toBe(
      "https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"
    );
  });

  it("encodes keys with spaces and supports path-style", () => {
    const url = presignS3(
      { endpoint: "https://t3.storageapi.dev", bucket: "b", region: "auto", accessKeyId: "k", secretAccessKey: "s" },
      { method: "PUT", key: "companion/My App.dmg", now: new Date("2026-11-07T00:00:00Z") }
    );
    expect(url.startsWith("https://t3.storageapi.dev/b/companion/My%20App.dmg?")).toBe(true);
    expect(url).toContain("X-Amz-Expires=300");
  });

  it("is off until the bucket variables are set", () => {
    expect(downloadsBucket({})).toBeNull();
    expect(downloadsBucket({ DOWNLOADS_BUCKET_ENDPOINT: "https://t3.storageapi.dev", DOWNLOADS_BUCKET: "b", DOWNLOADS_ACCESS_KEY_ID: "k", DOWNLOADS_SECRET_ACCESS_KEY: "s" })).toMatchObject({ region: "auto", virtualHost: true });
  });
});
