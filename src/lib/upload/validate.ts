import "server-only";

const MAX_DATA_URL_LENGTH = 3_000_000; // ~2.2MB decoded — plenty for a resized JPEG

/** Validates a client-produced image data: URL before it's persisted — never
    trust the client's own size/type claims. */
export function assertValidImageDataUrl(value: string): void {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(value)) {
    throw new Error("That doesn't look like a valid image upload.");
  }
  if (value.length > MAX_DATA_URL_LENGTH) {
    throw new Error("That image is too large. Please choose a smaller one.");
  }
}

const VIDEO_HOST_PATTERNS = [/(^|\.)youtube\.com$/, /^youtu\.be$/, /(^|\.)vimeo\.com$/, /(^|\.)loom\.com$/];

/** Only known, embeddable video hosts are accepted — anything else is
    rejected rather than silently rendered as an unsafe iframe source. */
export function assertValidVideoUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("That doesn't look like a valid video link.");
  }
  if (url.protocol !== "https:") throw new Error("Video links must use https://.");
  if (!VIDEO_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new Error("Video links must be from YouTube, Vimeo, or Loom.");
  }
}
