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
    <div className="px-3 pb-2">
      <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Switch view</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-raised p-1" role="radiogroup" aria-label="Switch view">
        {views.map((v) => {
          const active = v.role === current;
          return (
            <button
              key={v.role}
              type="button"
              role="radio"
              aria-checked={active}
              title={v.label}
              onClick={() => switchTo(v.role)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-medium leading-tight transition-colors",
                active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {busy === v.role ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <v.icon className={cn("h-4 w-4", active && "text-primary")} />
              )}
              <span className="truncate">{v.label}</span>
              {active && <span className="sr-only">Current</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
