"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, FilePlus2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CANDIDATE_NAV, EMPLOYER_NAV, ADMIN_NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import type { UserRole } from "@prisma/client";

// The real UserRole enum, not a hand-copied list — a role added there (e.g.
// REFERRER) falls through to CANDIDATE_NAV by default rather than failing
// to compile.
export function navItemsFor(role: UserRole = "CANDIDATE", careersPublisher = false): NavItem[] {
  const base = role === "PLATFORM_ADMIN" ? ADMIN_NAV : role === "EMPLOYER" || role === "COMPANY_ADMIN" ? EMPLOYER_NAV : CANDIDATE_NAV;
  // Career OS Careers publishers (assigned in Admin) can be any kind of account.
  return careersPublisher
    ? [...base, { href: "/careers/manage", label: "Manage Careers", icon: FilePlus2, available: true }]
    : base;
}

/* A nav item stays highlighted on its sub-pages too (/interview-ai/abc),
   except Home, which would otherwise match everything under /dashboard. */
function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== "/dashboard" && href !== "/admin" && pathname.startsWith(`${href}/`);
}

/** The nav list itself, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ role, careersPublisher, onNavigate }: { role?: UserRole; careersPublisher?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItemsFor(role, careersPublisher);
  // Consecutive items with the same section form one group.
  const groups: { section?: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
      {groups.map((group, gi) => (
        <div key={group.section ?? `g${gi}`} className={cn(gi > 0 && "mt-3 border-t border-border pt-3")}>
          {group.section && (
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.section}</p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              if (!item.available) {
                return (
                  <div key={item.href} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/50">
                    <span className="flex items-center gap-3">
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </span>
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
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
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-raised font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:bg-surface-raised/70 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function UpgradeCard({ onNavigate, role }: { onNavigate?: () => void; role?: UserRole }) {
  const employer = role === "EMPLOYER" || role === "COMPANY_ADMIN";
  if (role === "PLATFORM_ADMIN") return null;
  return (
    <div className="border-t border-border p-3">
      <Link
        href={employer ? "/employer/enterprise/billing" : "/pricing"}
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
          {employer ? "Recruiter Suite plans" : "Upgrade your plan"}
        </span>
        <span className="relative text-xs text-muted-foreground">
          {employer
            ? "Resume search, AI screening, InMail and boosts."
            : "Unlock Auto Apply limits, Interview AI, and more."}
        </span>
      </Link>
    </div>
  );
}

/** Desktop sidebar. Below the lg breakpoint the same nav lives in the
    Topbar's slide-out menu (see MobileNav). */
export function Sidebar({
  role = "CANDIDATE",
  careersPublisher = false,
  viewRoles = [],
}: {
  role?: UserRole;
  careersPublisher?: boolean;
  viewRoles?: UserRole[];
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 items-center px-5">
        <Logo />
      </div>
      <ViewSwitcher role={role} viewRoles={viewRoles} />
      <SidebarNav role={role} careersPublisher={careersPublisher} />
      <UpgradeCard role={role} />
    </aside>
  );
}
