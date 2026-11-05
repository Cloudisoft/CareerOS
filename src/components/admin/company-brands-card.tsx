"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface Coverage {
  checked: number;
  total: number;
  withLogo: number;
  withCover: number;
  pending: number;
}

/** Shows how many companies have a real logo and banner, and fetches more on demand. */
export function CompanyBrandsCard() {
  const [c, setC] = useState<Coverage | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((j) => setC(j.data ?? null))
      .catch(() => {});
  }, []);

  async function run() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/admin/brands", { method: "POST" }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) return setNote(json?.error?.message ?? "Couldn't look up logos right now.");
    setC(json.data);
    setNote(json.data.checked ? `Checked ${json.data.checked} companies.` : "Every company has been checked recently.");
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ImageIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">Company logos &amp; banners</p>
        <p className="text-sm text-muted-foreground">
          {c ? `${c.withLogo} of ${c.total} companies have a logo, ${c.withCover} have a banner.` : "Loading…"} Logos come from each company&apos;s own website and are filled in automatically; companies with no confident match keep a letter tile.
        </p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      <button type="button" onClick={run} disabled={busy || c?.pending === 0} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface-raised disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {c?.pending === 0 ? "All checked" : `Find logos now${c?.pending ? ` (${c.pending} to check)` : ""}`}
      </button>
    </div>
  );
}
