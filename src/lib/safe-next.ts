/**
 * Where to send someone after logging in or signing up. Only same-site paths are allowed, so a crafted
 * `?next=https://evil.example` (or `//evil.example`) link can't bounce a freshly logged-in user off-site.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
