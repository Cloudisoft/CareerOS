"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Clock, Loader2, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BoardRole {
  id: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  matched: string[];
  score: number | null;
  minYears: number | null;
  pay: string | null;
  applyUrl: string;
  postedAt: string;
}

/** The AI Work role list: search, field chips, best-fit sort, apply and practise. */
export function RoleBoard({ roles, categories, canPractise }: { roles: BoardRole[]; categories: string[]; canPractise: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"fit" | "pay" | "new">("fit");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; upgrade: boolean } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = roles.filter(
      (r) =>
        (!category || r.category === category) &&
        (!term || r.title.toLowerCase().includes(term) || r.skills.some((s) => s.toLowerCase().includes(term)) || r.category.toLowerCase().includes(term))
    );
    const payTop = (r: BoardRole) => Number(r.pay?.match(/(\d+)(?=\/h)/)?.[1] ?? 0);
    return [...list].sort((a, b) =>
      sort === "fit" ? (b.score ?? -1) - (a.score ?? -1) : sort === "pay" ? payTop(b) - payTop(a) : b.postedAt.localeCompare(a.postedAt)
    );
  }, [roles, q, category, sort]);

  async function practise(id: string) {
    setBusy(id);
    setError(null);
    const res = await fetch("/api/interview/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "MIXED", aiWorkRoleId: id }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (res?.ok && json?.data?.session?.id) {
      router.push(`/interview-ai/${json.data.session.id}`);
      return;
    }
    setBusy(null);
    setError(
      res?.status === 402
        ? { text: "Interview practice is part of the paid plans.", upgrade: true }
        : { text: json?.error?.message ?? "Couldn't start the practice interview. Please try again.", upgrade: false }
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search AI roles</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by role or skill, e.g. Python, tax, medicine"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground"
          >
            <option value="fit">Best fit for me</option>
            <option value="pay">Highest pay</option>
            <option value="new">Newest</option>
          </select>
        </label>
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              category === c ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/80 hover:border-primary/40"
            )}
          >
            {c ?? "All fields"}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" data-testid="practice-error" className="mt-3 text-sm text-destructive">
          {error.text}{" "}
          {error.upgrade && (
            <a href="/pricing" className="font-semibold underline">
              See plans
            </a>
          )}
        </p>
      )}

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {shown.length} {shown.length === 1 ? "role" : "roles"}
      </p>

      <ul className="mt-2 grid gap-3 lg:grid-cols-2">
        {shown.map((r) => {
          const expanded = open === r.id;
          return (
            <li key={r.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{r.category}</p>
                  <h3 className="mt-0.5 font-semibold leading-snug text-foreground">{r.title}</h3>
                </div>
                {r.score != null && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      r.score >= 60 ? "bg-success/10 text-success" : r.score >= 30 ? "bg-primary/10 text-primary" : "bg-surface-raised text-muted-foreground"
                    )}
                    title="How many of the role's skills are on your Career Profile"
                  >
                    {r.score}% fit
                  </span>
                )}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {r.pay && <span className="font-semibold text-foreground">{r.pay}</span>}
                <span className="text-muted-foreground">Remote · flexible hours</span>
                {r.minYears ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.minYears}+ yrs
                  </span>
                ) : null}
              </p>
              {r.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.skills.map((s) => {
                    const have = r.matched.includes(s);
                    return (
                      <span
                        key={s}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          have ? "border-success/30 bg-success/10 text-success" : "border-border text-foreground/75"
                        )}
                      >
                        {have && <Check className="h-3 w-3" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className={cn("mt-3 whitespace-pre-line text-sm text-muted-foreground", !expanded && "line-clamp-3")}>{r.description}</p>
              {r.description.length > 180 && (
                <button type="button" onClick={() => setOpen(expanded ? null : r.id)} className="mt-1 self-start text-sm font-semibold text-primary hover:underline">
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                <a
                  href={r.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
                >
                  Apply on micro1 <ArrowUpRight className="h-4 w-4" />
                </a>
                {canPractise && (
                  <button
                    type="button"
                    onClick={() => practise(r.id)}
                    disabled={busy !== null}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface-raised disabled:opacity-60"
                  >
                    {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Practise the AI interview
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && roles.length > 0 && <p className="py-10 text-center text-sm text-muted-foreground">No roles match. Try another field or search.</p>}
    </div>
  );
}
