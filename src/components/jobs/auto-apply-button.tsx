"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutoApplyJob {
  id: string;
  url: string;
  title: string;
  company: string;
  location?: string | null;
}

type Status = { tone: "ok" | "warn" | "error"; text: string } | null;

/** Whether the CareerOS extension is installed in this browser (it announces itself on CareerOS pages). */
export function useCareerOSExtension() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const d = e.data as { source?: string; type?: string; version?: string } | null;
      if (d?.source === "careeros-extension" && d.type === "careeros-extension:ready") setVersion(d.version || "installed");
    };
    window.addEventListener("message", onMessage);
    // Ask again in case the announcement came before this page was listening.
    window.postMessage({ type: "careeros-extension:ping" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return version;
}

/**
 * "Auto apply" for a posting on another site: with the CareerOS extension, the posting opens in a new tab and is
 * filled there; questions CareerOS doesn't know yet are asked once on small cards, and answers it remembers are
 * filled without asking. Without the extension, it's the usual "Apply on company site" link plus a pointer to it.
 */
export function AutoApplyButton({ job, className, size = "md" }: { job: AutoApplyJob; className?: string; size?: "md" | "lg" }) {
  const extension = useCareerOSExtension();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const pending = useRef<string | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const d = e.data as { source?: string; type?: string; requestId?: string; ok?: boolean; reason?: string; message?: string } | null;
      if (d?.source !== "careeros-extension" || d.type !== "careeros-extension:apply-result" || d.requestId !== pending.current) return;
      pending.current = null;
      setBusy(false);
      if (d.ok) setStatus({ tone: "ok", text: d.message || "Opened in a new tab. CareerOS is filling it." });
      else if (d.reason === "applied") setStatus({ tone: "warn", text: d.message || "You already applied to this job." });
      else setStatus({ tone: "error", text: d.message || "The extension couldn't open this job. Open it below and click the CareerOS icon." });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const height = size === "lg" ? "h-11 px-6" : "h-10 px-5";

  if (!extension) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background hover:opacity-90", height)}
        >
          Apply on company site <ExternalLink className="h-4 w-4" />
        </a>
        <Link href="/auto-apply" className="text-xs text-muted-foreground hover:text-foreground">
          Get the CareerOS extension to fill it for you
        </Link>
      </div>
    );
  }

  function start() {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pending.current = requestId;
    setBusy(true);
    setStatus(null);
    window.postMessage(
      { type: "careeros-extension:apply", requestId, job: { id: job.id, url: job.url, title: job.title, company: job.company, location: job.location ?? "" } },
      window.location.origin
    );
    // The extension answers within a moment; if it doesn't (it was just updated or disabled), fall back to the link.
    window.setTimeout(() => {
      if (pending.current !== requestId) return;
      pending.current = null;
      setBusy(false);
      setStatus({ tone: "error", text: "The extension didn't answer. Reload this page, or open the posting below." });
    }, 8000);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className={cn("inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gradient text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-70", height)}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Auto apply
        </button>
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          Open posting <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {status && (
        <p role="status" className={cn("max-w-md text-xs", status.tone === "ok" ? "text-success" : status.tone === "warn" ? "text-muted-foreground" : "text-destructive")}>
          {status.text}
        </p>
      )}
    </div>
  );
}
