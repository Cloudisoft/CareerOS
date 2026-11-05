"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/silvercareers", label: "SilverCareers" },
  { href: "/careers", label: "Careers" },
  { href: "/features", label: "Features" },
  { href: "/employers", label: "For Employers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

interface MarketingNavbarProps {
  user?: { firstName: string; lastName: string; email: string; avatarUrl: string | null } | null;
}

export function MarketingNavbar({ user = null }: MarketingNavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Full-width at the top of the page; a floating rounded bar once you scroll.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);
  const floating = scrolled || open;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    // Fixed height in both states, so the page never shifts as the bar changes shape.
    <header className="sticky top-0 z-50 h-[72px] px-3 sm:px-4">
      <div
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-300 ease-out motion-reduce:transition-none",
          floating
            ? "mt-2.5 h-[56px] max-w-6xl rounded-2xl border border-border bg-surface/90 px-3 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-md sm:px-4"
            : "mt-0 h-[72px] max-w-7xl rounded-none border border-transparent bg-transparent px-3 sm:px-6"
        )}
      >
        <Link href="/" className="inline-flex shrink-0 items-center gap-2" aria-label="Career OS home">
          <span
            className={cn(
              "flex items-center justify-center rounded-xl transition-all duration-300 motion-reduce:transition-none",
              floating ? "h-10 w-10 bg-primary/10" : "h-8 w-8 bg-transparent"
            )}
          >
            <Image src="/brand/icon-transparent.png" alt="" width={375} height={374} priority className="h-8 w-8 object-contain" />
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight text-foreground transition-all duration-300 motion-reduce:transition-none",
              floating ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
            )}
          >
            career<span className="brand-gradient-text">OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-9 w-9">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
                  <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-all duration-300 motion-reduce:transition-none",
                  floating ? "bg-foreground text-background hover:opacity-90" : "bg-brand-gradient text-white shadow-[0_6px_20px_-8px_rgba(223,76,44,0.7)] hover:opacity-95"
                )}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border bg-surface shadow-xl transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-[520px] border-border" : "max-h-0 border-transparent"
        )}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {user ? (
              <>
                <Button asChild variant="secondary" size="md">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="md" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="secondary" size="md">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="md">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
