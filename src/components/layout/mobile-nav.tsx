"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SidebarNav, UpgradeCard } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

/**
 * The sidebar's navigation for screens narrower than the lg breakpoint,
 * where the sidebar itself is hidden — without this, phones and most
 * tablets had no way to reach Interview AI, Learning, Resume Studio, etc.
 * A menu button in the top bar opens it as a slide-out drawer.
 */
export function MobileNav({ role }: { role?: UserRole }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  // Close after navigating, and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-surface-raised"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portalled to <body>: the top bar's backdrop blur makes it the
          containing block for fixed children, which squashed the drawer to
          the bar's 64px height. */}
      {mounted && createPortal(
        <>
          <div
            className={cn(
              "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
              open ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <aside
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            aria-hidden={!open}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:hidden",
              // invisible when closed so its links aren't reachable by Tab
              open ? "visible translate-x-0" : "invisible -translate-x-full"
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
            <UpgradeCard onNavigate={() => setOpen(false)} />
          </aside>
        </>,
        document.body
      )}
    </div>
  );
}
