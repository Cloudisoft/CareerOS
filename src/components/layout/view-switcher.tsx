"use client";

import { useState } from "react";
import { Briefcase, Loader2, ShieldCheck, UserRound } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

/** Fixed order: job seeker, recruiter, then platform admin last. */
const VIEWS: { role: UserRole; label: string; icon: typeof UserRound }[] = [
  { role: "CANDIDATE", label: "Job seeker", icon: UserRound },
  { role: "EMPLOYER", label: "Recruiter", icon: Briefcase },
  { role: "PLATFORM_ADMIN", label: "Platform admin", icon: ShieldCheck },
];

/**
 * One-tap switch between the areas a full-access account can use, shown at
 * the top of the sidebar and the mobile menu. Hidden for everyone else.
 */
export function ViewSwitcher({ role, viewRoles }: { role?: UserRole; viewRoles: UserRole[] }) {
  const [busy, setBusy] = useState<UserRole | null>(null);
  const current = role === "COMPANY_ADMIN" ? "EMPLOYER" : role;
  const views = VIEWS.filter((v) => viewRoles.includes(v.role));
  if (views.length < 2) return null;

  async function switchTo(next: UserRole) {
    if (next === current || busy) return;
    setBusy(next);
    const res = await fetch("/api/auth/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (res?.ok) window.location.href = json?.data?.home ?? "/dashboard";
    else setBusy(null);
  }

  return (
    <div className="border-b border-border px-4 py-3">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Switch view</p>
      <div className="grid gap-1" role="radiogroup" aria-label="Switch view">
        {views.map((v) => {
          const active = v.role === current;
          return (
            <button
              key={v.role}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => switchTo(v.role)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              )}
            >
              {busy === v.role ? <Loader2 className="h-4 w-4 animate-spin" /> : <v.icon className="h-4 w-4" />}
              {v.label}
              {active && <span className="ml-auto text-[10px] uppercase tracking-wide">Current</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
