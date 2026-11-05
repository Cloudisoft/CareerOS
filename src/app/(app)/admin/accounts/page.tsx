"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Mail, UserPlus, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const CANDIDATE_PLANS = [
  ["BASIC", "Basic"],
  ["STANDARD", "Standard"],
  ["PREMIUM", "Premium"],
  ["ELITE", "Elite"],
] as const;
const ENTERPRISE_PLANS = [
  ["STARTER", "Starter"],
  ["PROFESSIONAL", "Professional"],
] as const;
const MONTHS = [
  [1, "1 month"],
  [3, "3 months"],
  [6, "6 months"],
  [12, "1 year"],
] as const;

interface Grant {
  kind: "CANDIDATE" | "ENTERPRISE";
  id: string;
  who: string;
  email: string | null;
  plan: string;
  endsAt: string | null;
  invited: boolean;
}

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No end date");

function addMonths(months: number) {
  const d = new Date();
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d.toISOString();
}

export default function AdminAccountsPage() {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [invite, setInvite] = useState<{ email: string; url: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  // create account form
  const [acc, setAcc] = useState({ email: "", firstName: "", lastName: "", type: "CANDIDATE" as "CANDIDATE" | "EMPLOYER", companyName: "", sendInvite: true });
  const [creating, setCreating] = useState(false);
  // grant form
  const [g, setG] = useState({ email: "", kind: "CANDIDATE" as "CANDIDATE" | "ENTERPRISE", plan: "ELITE", months: 3, companyName: "", convertToEmployer: false });
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/plans");
    const json = await res.json().catch(() => null);
    if (res.ok) setGrants(json.data.grants);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    setInvite(null);
    const res = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(acc) }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setCreating(false);
    if (!res?.ok) return setMsg({ ok: false, text: json?.error?.message ?? "Couldn't create the account." });
    setInvite({ email: json.data.user.email, url: json.data.inviteUrl, emailed: json.data.emailed });
    setMsg({ ok: true, text: `Account created for ${json.data.user.email}${json.data.company ? ` with company ${json.data.company.name}` : ""}.` });
    // Hand straight over to "Give a plan" for the new account.
    setG((x) => ({ ...x, email: json.data.user.email, kind: acc.type === "EMPLOYER" ? "ENTERPRISE" : "CANDIDATE", plan: acc.type === "EMPLOYER" ? "PROFESSIONAL" : "ELITE", companyName: acc.companyName }));
    setAcc({ email: "", firstName: "", lastName: "", type: acc.type, companyName: "", sendInvite: true });
  }

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setGranting(true);
    setMsg(null);
    const body = g.kind === "CANDIDATE" ? { kind: g.kind, email: g.email, plan: g.plan, months: g.months } : { kind: g.kind, email: g.email, plan: g.plan, months: g.months, companyName: g.companyName, convertToEmployer: g.convertToEmployer };
    const res = await fetch("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setGranting(false);
    if (!res?.ok) return setMsg({ ok: false, text: json?.error?.message ?? "Couldn't give the plan." });
    const d = json.data;
    setMsg({ ok: true, text: `${d.company ?? d.email} now has ${d.plan.charAt(0) + d.plan.slice(1).toLowerCase()} until ${fmt(d.endsAt)}. No charge.` });
    load();
  }

  async function revoke(row: Grant) {
    if (!window.confirm(`End ${row.who}'s ${row.plan.toLowerCase()} plan now? They move to the free tier; their data is kept.`)) return;
    const res = await fetch("/api/admin/plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row.kind === "CANDIDATE" ? { kind: row.kind, userId: row.id } : { kind: row.kind, companyId: row.id }),
    });
    const json = await res.json().catch(() => null);
    setMsg(res.ok ? { ok: true, text: `Ended ${row.who}'s plan.` } : { ok: false, text: json?.error?.message ?? "Couldn't end the plan." });
    load();
  }

  async function resend(email: string) {
    const res = await fetch("/api/admin/accounts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const json = await res.json().catch(() => null);
    if (res.ok) setInvite({ email, url: json.data.inviteUrl, emailed: json.data.emailed });
    else setMsg({ ok: false, text: json?.error?.message ?? "Couldn't create a new link." });
  }

  const plans = g.kind === "CANDIDATE" ? CANDIDATE_PLANS : ENTERPRISE_PLANS;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Accounts &amp; plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create Career OS accounts and give them a job seeker or company plan for a set time. Granted plans are never charged and end on their own.</p>
      </div>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("rounded-lg border px-4 py-3 text-sm", msg.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive")}>
          {msg.text}
        </p>
      )}

      {invite && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            {invite.emailed ? `Invitation emailed to ${invite.email}.` : `Send this link to ${invite.email} so they can set a password.`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">The set-password link works for 7 days. They can also sign in with Google using this email.</p>
          <div className="mt-3 flex gap-2">
            <input readOnly value={invite.url} className={cn(input, "font-mono text-xs")} aria-label="Set-password link" onFocus={(e) => e.currentTarget.select()} />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(invite.url).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-raised"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={createAccount} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-primary" /> Create an account
          </p>
          <Segmented
            label="Account type"
            value={acc.type}
            options={[
              ["CANDIDATE", "Job seeker"],
              ["EMPLOYER", "Employer"],
            ]}
            onChange={(v) => setAcc({ ...acc, type: v as typeof acc.type })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input className={input} required value={acc.firstName} onChange={(e) => setAcc({ ...acc, firstName: e.target.value })} />
            </Field>
            <Field label="Last name">
              <input className={input} required value={acc.lastName} onChange={(e) => setAcc({ ...acc, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="Email">
            <input className={input} type="email" required value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} />
          </Field>
          {acc.type === "EMPLOYER" && (
            <Field label="Company name (optional)">
              <input className={input} value={acc.companyName} onChange={(e) => setAcc({ ...acc, companyName: e.target.value })} placeholder="Creates the company profile for them" />
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={acc.sendInvite} onChange={(e) => setAcc({ ...acc, sendInvite: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Email them a link to set their password
          </label>
          <button type="submit" disabled={creating} className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </button>
        </form>

        <form onSubmit={grant} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Gift className="h-4 w-4 text-primary" /> Give a plan
          </p>
          <Segmented
            label="Plan type"
            value={g.kind}
            options={[
              ["CANDIDATE", "Job seeker plan"],
              ["ENTERPRISE", "Enterprise plan"],
            ]}
            onChange={(v) => setG({ ...g, kind: v as typeof g.kind, plan: v === "CANDIDATE" ? "ELITE" : "PROFESSIONAL" })}
          />
          <Field label="Account email">
            <input className={input} type="email" required value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan">
              <select className={input} value={g.plan} onChange={(e) => setG({ ...g, plan: e.target.value })}>
                {plans.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valid for">
              <select className={input} value={g.months} onChange={(e) => setG({ ...g, months: Number(e.target.value) })}>
                {MONTHS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {g.kind === "ENTERPRISE" && (
            <>
              <Field label="Company name (if they don't have one yet)">
                <input className={input} value={g.companyName} onChange={(e) => setG({ ...g, companyName: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={g.convertToEmployer} onChange={(e) => setG({ ...g, convertToEmployer: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Switch a job seeker account to an employer account (their data is kept)
              </label>
            </>
          )}
          <p className="text-xs text-muted-foreground">Active until {fmt(addMonths(g.months))}. No charge; it ends on its own. Giving a new plan replaces any granted plan they already have.</p>
          <button type="submit" disabled={granting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">
            {granting && <Loader2 className="h-4 w-4 animate-spin" />} Give plan
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <p className="font-semibold text-foreground">Granted plans</p>
          <p className="text-xs text-muted-foreground">Plans given by an admin that are still running, soonest to end first.</p>
        </div>
        {grants === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : grants.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No granted plans yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {grants.map((row) => (
              <li key={`${row.kind}-${row.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", row.kind === "CANDIDATE" ? "bg-sky-500/10 text-sky-600" : "bg-violet-500/10 text-violet-600")}>
                  {row.kind === "CANDIDATE" ? "Job seeker" : "Enterprise"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.who} · {row.plan.charAt(0) + row.plan.slice(1).toLowerCase()}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.email ?? "—"} · {row.endsAt ? `until ${fmt(row.endsAt)}` : "no end date"}
                    {row.invited && " · hasn't set a password yet"}
                  </p>
                </div>
                {row.invited && row.email && (
                  <button type="button" onClick={() => resend(row.email!)} className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-raised">
                    New invite link
                  </button>
                )}
                <button type="button" onClick={() => revoke(row)} className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive">
                  End plan
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: (readonly [string, string])[]; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-raised p-1" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("rounded-md py-1.5 text-sm font-medium transition-colors", value === v ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
