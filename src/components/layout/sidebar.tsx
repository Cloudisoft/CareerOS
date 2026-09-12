"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CANDIDATE_NAV, EMPLOYER_NAV, ADMIN_NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: "CANDIDATE" | "EMPLOYER" | "COMPANY_ADMIN" | "PLATFORM_ADMIN";
}

export function Sidebar({ role = "CANDIDATE" }: SidebarProps) {
  const pathname = usePathname();
  const items: NavItem[] =
    role === "PLATFORM_ADMIN"
      ? ADMIN_NAV
      : role === "EMPLOYER" || role === "COMPANY_ADMIN"
        ? EMPLOYER_NAV
        : CANDIDATE_NAV;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const active = pathname === item.href;
          if (!item.available) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50"
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-brand-gradient text-white shadow-[0_2px_12px_rgba(239,134,45,0.3)]"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-surface-raised hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute -left-4 h-5 w-1 rounded-r-full bg-brand-gradient" aria-hidden />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/pricing"
          className="group relative flex flex-col gap-1 overflow-hidden rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-primary/40"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: "radial-gradient(120px 80px at 20% 0%, rgba(239,134,45,0.15), transparent)" }}
            aria-hidden
          />
          <span className="relative flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Upgrade your plan
          </span>
          <span className="relative text-xs text-muted-foreground">
            Unlock Auto Apply limits, Interview AI, and more.
          </span>
        </Link>
      </div>
    </aside>
  );
}
