"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-app "Back": returns to the previous Career OS page in this tab,
 * filters and all. Changes within one page (a new filter, another job
 * selected) replace the last entry, so Back goes to the previous page,
 * not the previous filter. With nothing to go back to (a page opened from
 * a link), it goes up a level instead of leaving the site.
 */
const KEY = "careeros-nav-history";
const MAX = 40;

function read(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
function write(stack: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)));
  } catch {}
}
const pathOf = (url: string) => url.split("?")[0];

/** Records each page visited. Mount once in the app shell. */
export function NavHistoryTracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    const url = pathname + (params.toString() ? `?${params}` : "");
    const stack = read();
    const top = stack[stack.length - 1];
    if (top && pathOf(top) === pathname) stack[stack.length - 1] = url;
    else stack.push(url);
    write(stack);
  }, [pathname, params]);
  return null;
}

/** The page Back would open, or null when there's no earlier page in this tab. */
export function previousPage(current: string) {
  const stack = read();
  for (let i = stack.length - 1; i >= 0; i--) if (pathOf(stack[i]) !== current) return stack[i];
  return null;
}

/** Section pages that exist on their own, so "up a level" never lands on a missing page. */
const SECTIONS = new Set([
  "/jobs", "/applications", "/messages", "/ai-work", "/network", "/careers", "/job-gpt", "/auto-apply", "/resume-studio",
  "/cover-letter-studio", "/interview-ai", "/learning", "/profile", "/employer/jobs", "/employer/talent", "/employer/enterprise",
  "/employer/company", "/admin",
]);

function parentOf(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  for (let n = parts.length - 1; n > 0; n--) {
    const candidate = "/" + parts.slice(0, n).join("/");
    if (SECTIONS.has(candidate)) return candidate;
  }
  return "/dashboard";
}

export function BackButton({ fallback, label = "Back", className }: { fallback?: string; label?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function goBack() {
    const stack = read();
    // Drop the current page (and any entries for it), then go to what's left on top.
    while (stack.length && pathOf(stack[stack.length - 1]) === pathname) stack.pop();
    const target = stack[stack.length - 1];
    write(stack);
    router.push(target ?? fallback ?? parentOf(pathname));
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
