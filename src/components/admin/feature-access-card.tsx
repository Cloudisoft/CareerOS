"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Check, Loader2, MessageSquare, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Feature = "INTERVIEW_AI" | "LEARNING_HUB";
const FEATURES: { key: Feature; label: string; icon: typeof BookOpen; blurb: string }[] = [
  { key: "INTERVIEW_AI", label: "Interview AI", icon: MessageSquare, blurb: "Unlimited mock interviews, company prep and Live Copilot" },
  { key: "LEARNING_HUB", label: "Learning Hub", icon: BookOpen, blurb: "All courses, lessons and quizzes" },
];
const LABEL: Record<Feature, string> = { INTERVIEW_AI: "Interview AI", LEARNING_HUB: "Learning Hub" };
const MONTHS = [
  [1, "1 month"],
  [3, "3 months"],
  [6, "6 months"],
  [12, "1 year"],
] as const;

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string | null;
  access: { feature: Feature; endsAt: string | null; paid: boolean }[];
}
interface Grant {
  userId: string;
  who: string;
  email: string;
  feature: Feature;
  endsAt: string | null;
}

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "no end date");
function endDate(months: number) {
  const d = new Date();
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d.toISOString();
}

/**
 * Give one account Interview AI and/or Learning Hub on their own for a set time (e.g. someone who joined
 * offline). Never charged; ends on its own. Backed by /api/admin/feature-access and /api/admin/accounts/search.
 */
export function FeatureAccessCard({ onMessage }: { onMessage: (m: { ok: boolean; text: string }) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Account[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<Account | null>(null);
  const [features, setFeatures] = useState<Feature[]>(["INTERVIEW_AI", "LEARNING_HUB"]);
  const [months, setMonths] = useState<number>(6);
  const [saving, setSaving] = useState(false);
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/feature-access").catch(() => null);
    const json = await res?.json().catch(() => null);
    setGrants(res?.ok ? json.data.grants : []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (picked || q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/admin/accounts/search?q=${encodeURIComponent(q.trim())}`).catch(() => null);
      const json = await res?.json().catch(() => null);
      setResults(res?.ok ? json.data.accounts : []);
      setSearching(false);
    }, 250);
  }, [q, picked]);

  function toggle(f: Feature) {
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function give(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) return onMessage({ ok: false, text: "Pick an account first." });
    if (!features.length) return onMessage({ ok: false, text: "Tick Interview AI, Learning Hub or both." });
    setSaving(true);
    const res = await fetch("/api/admin/feature-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: picked.id, features, months }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) return onMessage({ ok: false, text: json?.error?.message ?? "Couldn't give access." });
    const names = (json.data.features as Feature[]).map((f) => LABEL[f]).join(" and ");
    onMessage({ ok: true, text: `${json.data.email} now has ${names} until ${fmt(json.data.endsAt)}. No charge.` });
    setPicked(null);
    setQ("");
    load();
  }

  async function end(g: Grant) {
    if (!window.confirm(`End ${g.who || g.email}'s ${LABEL[g.feature]} access now?`)) return;
    const res = await fetch("/api/admin/feature-access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: g.userId, feature: g.feature }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    onMessage(res?.ok ? { ok: true, text: `Ended ${g.who || g.email}'s ${LABEL[g.feature]} access.` } : { ok: false, text: json?.error?.message ?? "Couldn't end access." });
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <form onSubmit={give} className="space-y-4 border-b border-border p-5">
        <div>
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" /> Give Interview AI or Learning Hub
          </p>
          <p className="mt-1 text-xs text-muted-foreground">For someone who joined offline: access on its own, whatever their plan. Never charged; it ends on its own.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Account</span>
            {picked ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{picked.name || picked.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {picked.email}
                    {picked.plan ? ` · ${picked.plan.charAt(0) + picked.plan.slice(1).toLowerCase()} plan` : " · Free plan"}
                    {picked.access.map((a) => ` · ${LABEL[a.feature]}${a.paid ? " (paid)" : a.endsAt ? ` until ${fmt(a.endsAt)}` : ""}`).join("")}
                  </p>
                </div>
                <button type="button" onClick={() => setPicked(null)} className="rounded-md p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground" aria-label="Choose another account">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className={cn(input, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search accounts" />
                {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                {results.length > 0 && (
                  <ul role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg">
                    {results.map((a) => (
                      <li key={a.id}>
                        <button type="button" role="option" aria-selected={false} onClick={() => setPicked(a)} className="block w-full px-3 py-2 text-left hover:bg-surface-raised">
                          <span className="block truncate text-sm font-medium text-foreground">{a.name || a.email}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {a.email} · {a.role === "CANDIDATE" ? "Job seeker" : a.role === "PLATFORM_ADMIN" ? "Admin" : "Employer"}
                            {a.access.length ? ` · has ${a.access.map((x) => LABEL[x.feature]).join(", ")}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching && q.trim().length >= 2 && results.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">No account matches. Create it above first.</p>
                )}
              </div>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Valid for</span>
            <select className={input} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {MONTHS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Access to give">
          {FEATURES.map(({ key, label, icon: Icon, blurb }) => {
            const on = features.includes(key);
            return (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(key)}
                className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors", on ? "border-primary bg-primary/5" : "border-border hover:bg-surface-raised")}
              >
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-primary" /> {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Active until {fmt(endDate(months))}. Giving it again restarts the time from today.</p>
          <button type="submit" disabled={saving || !picked || !features.length} className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Give access
          </button>
        </div>
      </form>

      <div className="px-5 py-4">
        <p className="font-semibold text-foreground">Granted Interview AI &amp; Learning Hub</p>
        <p className="text-xs text-muted-foreground">Still running, soonest to end first.</p>
      </div>
      {grants === null ? (
        <div className="flex justify-center pb-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : grants.length === 0 ? (
        <p className="px-5 pb-8 text-center text-sm text-muted-foreground">None given yet.</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {grants.map((g) => (
            <li key={`${g.userId}-${g.feature}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", g.feature === "INTERVIEW_AI" ? "bg-orange-500/10 text-orange-600" : "bg-emerald-500/10 text-emerald-600")}>
                {LABEL[g.feature]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{g.who || g.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {g.email} · until {fmt(g.endsAt)}
                </p>
              </div>
              <button type="button" onClick={() => end(g)} className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive">
                End access
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
