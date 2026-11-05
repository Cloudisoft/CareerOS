"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TILE_COLORS = [
  "bg-orange-500/15 text-orange-600",
  "bg-sky-500/15 text-sky-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-violet-500/15 text-violet-600",
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-600",
  "bg-teal-500/15 text-teal-600",
  "bg-indigo-500/15 text-indigo-600",
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The company's logo, or a coloured monogram tile when it has none. */
export function CompanyLogo({ name, logoUrl, size = 44, className }: { name: string; logoUrl?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  // A logo that fails to load falls back to the monogram instead of a broken image.
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={style}
        className={cn("shrink-0 rounded-lg border border-border bg-white object-contain p-0.5", className)}
      />
    );
  }
  const letters = name
    .replace(/[^A-Za-z0-9 &]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.round(size * 0.36) }}
      className={cn("flex shrink-0 items-center justify-center rounded-lg font-semibold", TILE_COLORS[hash(name) % TILE_COLORS.length], className)}
    >
      {letters || "?"}
    </span>
  );
}
