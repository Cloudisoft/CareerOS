"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "AI evaluation",
  "Engineering & data",
  "Finance & accounting",
  "Healthcare & medicine",
  "Legal & policy",
  "Languages & writing",
  "Creative & media",
  "Science & research",
  "Other expertise",
];

interface Role {
  id: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  minYears: number | null;
  payMin: number | null;
  payMax: number | null;
  payCurrency: string;
  applyUrl: string | null;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
}

const EMPTY = { title: "", category: CATEGORIES[0], description: "", skills: "", minYears: "", payMin: "", payMax: "", payCurrency: "USD", applyUrl: "", status: "ACTIVE" as Role["status"] };
type Form = typeof EMPTY;

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none";

export default function AdminAiWorkPage() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [referral, setReferral] = useState("");
  const [referralSaved, setReferralSaved] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ai-work");
    const json = await res.json().catch(() => null);
    if (res.ok) {
      setRoles(json.data.roles);
      setReferral(json.data.referralUrl ?? "");
      setReferralSaved(json.data.referralUrl ?? null);
    } else setMsg({ ok: false, text: json?.error?.message ?? "Couldn't load roles." });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function edit(r: Role) {
    setEditing(r.id);
    setShowForm(true);
    setForm({
      title: r.title,
      category: r.category,
      description: r.description,
      skills: r.skills.join(", "),
      minYears: r.minYears?.toString() ?? "",
      payMin: r.payMin?.toString() ?? "",
      payMax: r.payMax?.toString() ?? "",
      payCurrency: r.payCurrency,
      applyUrl: r.applyUrl ?? "",
      status: r.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function payload(f: Form) {
    const num = (v: string) => (v.trim() ? Number(v) : null);
    return {
      title: f.title,
      category: f.category,
      description: f.description,
      skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
      minYears: num(f.minYears),
      payMin: num(f.payMin),
      payMax: num(f.payMax),
      payCurrency: f.payCurrency || "USD",
      applyUrl: f.applyUrl.trim() || null,
      status: f.status,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(editing ? `/api/admin/ai-work/${editing}` : "/api/admin/ai-work", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(form)),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) return setMsg({ ok: false, text: json?.error?.message ?? "Couldn't save the role." });
    setMsg({ ok: true, text: editing ? "Role updated." : "Role added. It's live on AI Work now." });
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function setStatus(r: Role, status: Role["status"]) {
    const res = await fetch(`/api/admin/ai-work/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload({ ...EMPTY, ...toForm(r) }), status }),
    });
    if (res.ok) load();
  }

  async function remove(r: Role) {
    if (!window.confirm(`Delete "${r.title}"? Closing it instead keeps it out of sight but restorable.`)) return;
    const res = await fetch(`/api/admin/ai-work/${r.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function saveReferral(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/ai-work/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralUrl: referral.trim() || null }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) return setMsg({ ok: false, text: json?.error?.message ?? "Couldn't save the link." });
    setReferralSaved(json.data.referralUrl);
    setMsg({ ok: true, text: json.data.referralUrl ? "Referral link saved." : "Referral link removed." });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Work</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            micro1 roles shown to job seekers on{" "}
            <Link href="/ai-work" className="font-medium text-primary hover:underline">
              AI Work
            </Link>
            . People apply on micro1, and micro1 pays them.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(EMPTY);
              setShowForm(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add role
          </button>
        )}
      </div>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("rounded-lg border px-4 py-3 text-sm", msg.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive")}>
          {msg.text}
        </p>
      )}

      <form onSubmit={saveReferral} className="rounded-xl border border-border bg-surface p-5">
        <label htmlFor="referral" className="font-semibold text-foreground">
          micro1 referral link
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">Used by every Apply button that has no role-specific link, so Career OS gets referral credit.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input id="referral" className={input} placeholder="https://…" value={referral} onChange={(e) => setReferral(e.target.value)} />
          <button type="submit" className="h-10 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface-raised">
            Save link
          </button>
        </div>
        {!referralSaved && <p className="mt-2 text-xs text-muted-foreground">Not set: Apply buttons go to micro1&apos;s opportunities page.</p>}
      </form>

      {showForm && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/30 bg-surface p-5">
          <p className="font-semibold text-foreground">{editing ? "Edit role" : "New role"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role title">
              <input className={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AI Agent Evaluator" />
            </Field>
            <Field label="Field">
              <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Hourly pay from">
              <input className={input} inputMode="numeric" value={form.payMin} onChange={(e) => setForm({ ...form, payMin: e.target.value.replace(/\D/g, "") })} placeholder="25" />
            </Field>
            <Field label="Hourly pay to">
              <input className={input} inputMode="numeric" value={form.payMax} onChange={(e) => setForm({ ...form, payMax: e.target.value.replace(/\D/g, "") })} placeholder="45" />
            </Field>
            <Field label="Currency">
              <input className={input} maxLength={3} value={form.payCurrency} onChange={(e) => setForm({ ...form, payCurrency: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Years of experience (optional)">
              <input className={input} inputMode="numeric" value={form.minYears} onChange={(e) => setForm({ ...form, minYears: e.target.value.replace(/\D/g, "") })} placeholder="2" />
            </Field>
          </div>
          <Field label="Skills (comma-separated)">
            <input className={input} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, prompt evaluation, data analysis" />
          </Field>
          <Field label="What the work involves">
            <textarea
              required
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Link to this role on micro1 (optional; overrides the referral link)">
            <input className={input} value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} placeholder="https://www.micro1.ai/…" />
          </Field>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add role"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm(EMPTY);
              }}
              className="h-10 rounded-lg px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-surface">
        {roles === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : roles.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No roles yet. Add the first one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {roles.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {r.title}
                    {r.status === "CLOSED" && <span className="ml-2 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Closed</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.category}
                    {r.payMin || r.payMax ? ` · ${r.payCurrency} ${r.payMin ?? ""}${r.payMax ? `–${r.payMax}` : ""}/h` : ""}
                    {r.applyUrl && (
                      <a href={r.applyUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-primary hover:underline">
                        link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => setStatus(r, r.status === "ACTIVE" ? "CLOSED" : "ACTIVE")} className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-raised">
                  {r.status === "ACTIVE" ? "Close" : "Reopen"}
                </button>
                <button type="button" aria-label={`Edit ${r.title}`} onClick={() => edit(r)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" aria-label={`Delete ${r.title}`} onClick={() => remove(r)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function toForm(r: Role): Partial<Form> {
  return {
    title: r.title,
    category: r.category,
    description: r.description,
    skills: r.skills.join(", "),
    minYears: r.minYears?.toString() ?? "",
    payMin: r.payMin?.toString() ?? "",
    payMax: r.payMax?.toString() ?? "",
    payCurrency: r.payCurrency,
    applyUrl: r.applyUrl ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
