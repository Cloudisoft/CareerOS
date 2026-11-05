"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Loader2, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  code: string | null;
}

/** fetch + the app's { data } / { error } envelope, never throwing. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: init?.json !== undefined ? { "Content-Type": "application/json", ...(init?.headers || {}) } : init?.headers,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (body?.data as T) : null,
      error: res.ok ? null : body?.error?.message ?? "Something went wrong. Please try again.",
      code: res.ok ? null : body?.error?.code ?? null,
    };
  } catch {
    return { ok: false, status: 0, data: null, error: "Network error. Check your connection and try again.", code: "NETWORK" };
  }
}

export const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export interface Entitlements {
  jobsPerDay: number;
  resumeCredits: number;
  inmailCredits: number;
  freePostBoosts: number;
  freeCampaignBoosts: number;
  atsScreening: boolean;
  candidateEngagement: boolean;
  resumeFetching: boolean;
  companyOutreach: boolean;
  paidBoosts: boolean;
  jobAnnouncements: boolean;
}

interface Balance {
  granted: number;
  used: number;
  remaining: number;
}

export interface EnterpriseOverview {
  company: { id: string; name: string };
  role: string;
  canManageBilling: boolean;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "FREE";
  plan: "STARTER" | "PROFESSIONAL" | null;
  complimentary: boolean;
  entitlements: Entitlements;
  trial: { eligible: boolean; endsAt: string | null; days: number };
  intro: { eligible: boolean; priceCents: number; active: boolean };
  period: { start: string | null; end: string | null; cancelAtPeriodEnd: boolean };
  pendingDowngrade: { plan: string; requestedAt: string } | null;
  jobs: { postedToday: number; perDay: number; resetsAt: string };
  credits: { resume: Balance; inmail: Balance; postBoost: Balance; campaignBoost: Balance };
  plans: { key: "STARTER" | "PROFESSIONAL"; name: string; priceCents: number; introPriceCents: number; tagline: string; entitlements: Entitlements }[];
  boostPrices: { POST: number; CAMPAIGN: number };
  boostDays: { POST: number; CAMPAIGN: number };
}

interface Ctx {
  overview: EnterpriseOverview | null;
  refresh: () => Promise<void>;
}

const EnterpriseContext = createContext<Ctx>({ overview: null, refresh: async () => {} });
export const useEnterprise = () => useContext(EnterpriseContext);

const NAV = [
  { href: "/employer/enterprise", label: "Overview" },
  { href: "/employer/enterprise/candidates", label: "Resume search" },
  { href: "/employer/enterprise/pipeline", label: "Pipeline" },
  { href: "/employer/enterprise/screening", label: "AI screening" },
  { href: "/employer/enterprise/inmail", label: "InMail" },
  { href: "/employer/enterprise/boosts", label: "Posts & boosts" },
  { href: "/employer/enterprise/billing", label: "Billing" },
  { href: "/employer/enterprise/usage", label: "Usage" },
];

export const STATUS_LABEL: Record<EnterpriseOverview["status"], string> = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  FREE: "Free",
};

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [overview, setOverview] = useState<EnterpriseOverview | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "needs-company" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState(pathname);
  useEffect(() => setReturnTo(window.location.pathname + window.location.search), [pathname]);

  const refresh = useCallback(async () => {
    const res = await api<EnterpriseOverview>("/api/enterprise/state");
    if (res.code === "NEEDS_COMPANY") return setState("needs-company");
    if (!res.ok) {
      setError(res.error);
      return setState("error");
    }
    setOverview(res.data);
    setState("ready");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state === "needs-company") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center">
          <p className="font-medium text-foreground">Create your company profile first</p>
          <p className="mt-1 text-sm text-muted-foreground">The Recruiter Suite belongs to your company, so every recruiter on your team shares the plan.</p>
          <Button asChild className="mt-4">
            {/* Comes back here afterwards, so a plan picked on the Pricing page still opens checkout. */}
            <Link href={`/employer/company?next=${encodeURIComponent(returnTo)}`}>Set up company</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (state === "error" || !overview) return <ErrorBanner message={error ?? "Couldn't load your Recruiter Suite."} />;

  return (
    <EnterpriseContext.Provider value={{ overview, refresh }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Recruiter Suite</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {overview.company.name} ·{" "}
              {overview.plan && overview.status !== "FREE" && overview.status !== "EXPIRED"
                ? `${overview.plan === "STARTER" ? "Starter" : "Professional"} · `
                : ""}
              {overview.complimentary ? "Complimentary" : STATUS_LABEL[overview.status]}
            </p>
          </div>
        </div>
        {overview.status === "PAST_DUE" && (
          <ErrorBanner message="Your last payment didn't go through, so premium features are paused. Update your payment method in PayPal — everything resumes as soon as PayPal collects the payment." />
        )}
        <nav className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px" aria-label="Recruiter Suite">
          {NAV.map((item) => {
            const active = item.href === "/employer/enterprise" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </EnterpriseContext.Provider>
  );
}

export function ErrorBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div role="alert" className={cn("mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive", className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div role="status" className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      {message}
    </div>
  );
}

/** Shown in place of a feature the firm's plan doesn't include. Links to billing; never a dead button. */
export function UpgradeNotice({ feature, description }: { feature: string; description: string }) {
  const { overview } = useEnterprise();
  return (
    <Card>
      <CardContent className="flex flex-col items-center p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <p className="mt-4 font-semibold text-foreground">{feature} is a paid Recruiter Suite feature</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        {overview?.status === "TRIAL" && (
          <p className="mt-2 text-xs text-muted-foreground">Your free trial covers job posting only.</p>
        )}
        <Button asChild className="mt-5">
          <Link href="/employer/enterprise/billing">
            <Sparkles className="h-4 w-4" />
            {overview?.intro.eligible ? `See plans — first month ${usd(overview.intro.priceCents)}` : "See plans"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Lightweight modal using the app's own surfaces. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("max-h-[90vh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-2xl sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-surface-raised" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function newRequestId() {
  return crypto.randomUUID();
}

export const STAGE_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  VIEWED: "Reviewed",
  SCREENING: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const CATEGORY_LABEL: Record<string, string> = {
  HIGHLY_QUALIFIED: "Highly qualified",
  QUALIFIED: "Qualified",
  POTENTIAL_MATCH: "Potential match",
  NOT_SUITABLE: "Not suitable",
};

