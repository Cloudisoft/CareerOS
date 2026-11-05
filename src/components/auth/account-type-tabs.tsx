"use client";

import { Briefcase, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountType = "CANDIDATE" | "EMPLOYER";

/** "Job seeker" / "Employer" choice shared by the log-in and sign-up pages. */
export function AccountTypeTabs({ value, onChange }: { value: AccountType; onChange: (t: AccountType) => void }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
      {(
        [
          { type: "CANDIDATE", label: "Job seeker", hint: "Find and land jobs", icon: UserRound },
          { type: "EMPLOYER", label: "Employer", hint: "Hire great people", icon: Briefcase },
        ] as const
      ).map((o) => {
        const active = value === o.type;
        return (
          <button
            key={o.type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.type)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
              active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
            )}
          >
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted-foreground")}>
              <o.icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function accountTypeFrom(value: string | null): AccountType {
  return value === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
}
