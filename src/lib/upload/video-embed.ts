/** Turns a YouTube/Vimeo/Loom watch link into its embeddable iframe URL, or
    null if the link isn't one of those (callers should fall back to a plain
    link in that case — never render an arbitrary URL as an iframe src). */
export function toEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (/(^|\.)youtube\.com$/.test(u.hostname)) {
    if (u.pathname.startsWith("/embed/")) return url;
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (u.hostname === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (/(^|\.)loom\.com$/.test(u.hostname)) {
    return url.replace("/share/", "/embed/");
  }
  return null;
}
