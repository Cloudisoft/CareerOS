"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CANDIDATE_NAV, EMPLOYER_NAV, ADMIN_NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

// The real UserRole enum, not a hand-copied list — a role added there (e.g.
// REFERRER) falls through to CANDIDATE_NAV by default rather than failing
// to compile.
export function navItemsFor(role: UserRole = "CANDIDATE"): NavItem[] {
  if (role === "PLATFORM_ADMIN") return ADMIN_NAV;
  if (role === "EMPLOYER" || role === "COMPANY_ADMIN") return EMPLOYER_NAV;
  return CANDIDATE_NAV;
}

/* A nav item stays highlighted on its sub-pages too (/interview-ai/abc),
   except Home, which would otherwise match everything under /dashboard. */
function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== "/dashboard" && href !== "/admin" && pathname.startsWith(`${href}/`);
}

/** The nav list itself, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ role, onNavigate }: { role?: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItemsFor(role);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
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
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
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
  );
}

export function UpgradeCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-border p-4">
      <Link
        href="/pricing"
        onClick={onNavigate}
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
  );
}

/** Desktop sidebar. Below the lg breakpoint the same nav lives in the
    Topbar's slide-out menu (see MobileNav). */
export function Sidebar({ role = "CANDIDATE" }: { role?: UserRole }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>
      <SidebarNav role={role} />
      <UpgradeCard />
    </aside>
  );
}
