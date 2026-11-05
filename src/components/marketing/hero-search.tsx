"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Globe2,
  GraduationCap,
  Laptop,
  Loader2,
  ShieldCheck,
  Sprout,
  X,
} from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const EXAMPLES = [
  "Remote product designer",
  "Entry-level data analyst in Austin",
  "Registered nurse jobs near 10001",
  "Software engineering internship, summer 2027",
  "Marketing manager, hybrid, $90K+",
];

const CHIPS: {
  label: string;
  params: Record<string, string>;
  icon: typeof Laptop;
}[] = [
  { label: "Remote", params: { workplaceType: "REMOTE" }, icon: Laptop },
  {
    label: "Internships",
    params: { employmentType: "INTERNSHIP" },
    icon: GraduationCap,
  },
  {
    label: "No experience required",
    params: { experience: "none" },
    icon: Sprout,
  },
  { label: "Visa sponsorship", params: { visa: "1" }, icon: Globe2 },
];

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("turnstile")));
    if (!existing) {
      script.src = TURNSTILE_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * The home page search. Signed-in people go straight to results. Visitors
 * first pass a Cloudflare "verify you're human" check, then log in or sign
 * up, and land on their results afterwards.
 */
export function HeroSearch({
  siteKey,
  signedIn,
}: {
  siteKey: string | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [example, setExample] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "verifying" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (query) return;
    const t = setInterval(
      () => setExample((i) => (i + 1) % EXAMPLES.length),
      2800,
    );
    return () => clearInterval(t);
  }, [query]);

  function go(params: Record<string, string>) {
    const p = new URLSearchParams(params);
    const dest = `/jobs${p.toString() ? `?${p}` : ""}`;
    if (signedIn) {
      router.push(dest);
      return;
    }
    if (!siteKey) {
      window.location.href = `/login?from=search&next=${encodeURIComponent(dest)}`;
      return;
    }
    setError(null);
    setTarget(dest);
  }

  // Show the Cloudflare check once a visitor has searched.
  useEffect(() => {
    if (!target || !siteKey) return;
    let cancelled = false;
    setStatus("loading");
    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.turnstile) return;
        setStatus("idle");
        widgetId.current = window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          theme: document.documentElement.classList.contains("light")
            ? "light"
            : "dark",
          action: "home-search",
          callback: async (token: string) => {
            setStatus("verifying");
            const res = await fetch("/api/human/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            }).catch(() => null);
            if (res?.ok) {
              window.location.href = `/login?from=search&next=${encodeURIComponent(target)}`;
              return;
            }
            const json = await res?.json().catch(() => null);
            setStatus("error");
            setError(
              json?.error?.message ??
                "We couldn't verify you. Please try again.",
            );
          },
          "error-callback": () => {
            setStatus("error");
            setError("The check didn't load. Please refresh and try again.");
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setError(
          "The security check couldn't load. Check your connection and try again.",
        );
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile)
        window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [target, siteKey]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(query.trim() ? { q: query.trim() } : {});
        }}
        className="group flex items-center gap-3 rounded-[22px] border border-border bg-surface p-2.5 pl-5 shadow-[0_20px_60px_-20px_rgba(239,134,45,0.35)] transition-shadow focus-within:border-primary/60 focus-within:shadow-[0_20px_70px_-15px_rgba(239,134,45,0.5)]"
      >
        <label htmlFor="hero-search" className="sr-only">
          Search jobs
        </label>
        <input
          id="hero-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={EXAMPLES[example]}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground/80 focus:outline-none sm:h-14 sm:text-xl"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md transition-transform hover:scale-[1.04] active:scale-95 sm:h-14 sm:w-14"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() =>
              go({ ...(query.trim() ? { q: query.trim() } : {}), ...c.params })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-foreground/85 backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <c.icon className="h-4 w-4 text-primary" />
            {c.label}
          </button>
        ))}
      </div>

      {target &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="human-check-title"
          >
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl">
              <button
                type="button"
                onClick={() => setTarget(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2
                id="human-check-title"
                className="mt-3 text-lg font-semibold text-foreground"
              >
                Quick check
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm you&apos;re human, then log in or sign up to see your
                results.
              </p>
              <div
                ref={widgetRef}
                className="mt-5 flex min-h-[65px] justify-center"
              />
              {(status === "loading" || status === "verifying") && (
                <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {status === "loading" ? "Loading the check…" : "Verifying…"}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
