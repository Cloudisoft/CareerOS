"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, ErrorBanner, SuccessBanner } from "@/components/enterprise/shared";

interface FullAccessUser {
  userId: string;
  email: string;
  name: string;
  candidatePlan: string | null;
  company: string | null;
  enterprisePlan: string | null;
}
interface CompAccount {
  companyId: string;
  company: string;
  owner: string | null;
  plan: string;
  since: string;
}

/** Admin tools: full-access accounts and complimentary company plans. */
export function AccessCards() {
  const [full, setFull] = useState<FullAccessUser[] | null>(null);
  const [comps, setComps] = useState<CompAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fa, setFa] = useState({ email: "", companyName: "" });
  const [cp, setCp] = useState({ email: "", plan: "PROFESSIONAL", companyName: "", convertToEmployer: false });

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      api<{ users: FullAccessUser[] }>("/api/admin/full-access"),
      api<{ accounts: CompAccount[] }>("/api/admin/complimentary"),
    ]);
    if (!a.ok || !b.ok) return setError(a.error ?? b.error);
    setFull(a.data!.users);
    setComps(b.data!.accounts);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function grantFull() {
    if (!confirm(`Give ${fa.email} full access: platform admin, job seeker Elite + add-ons, and Enterprise Professional — all free, no expiry?`)) return;
    setBusy(true);
    setError(null);
    const res = await api<{ email: string; company: string }>("/api/admin/full-access", {
      method: "POST",
      json: { email: fa.email, companyName: fa.companyName || undefined },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`${res.data!.email} now has full access (company: ${res.data!.company}). They switch views from their profile menu.`);
    setFa({ email: "", companyName: "" });
    load();
  }

  async function revokeFull(u: FullAccessUser) {
    if (!confirm(`Remove the view switcher from ${u.email}? Their complimentary plans stay until you revoke them.`)) return;
    const res = await api("/api/admin/full-access", { method: "DELETE", json: { userId: u.userId } });
    if (!res.ok) return setError(res.error);
    load();
  }

  async function grantComp() {
    setBusy(true);
    setError(null);
    const res = await api<{ email: string; company: { name: string } }>("/api/admin/complimentary", {
      method: "POST",
      json: { email: cp.email, plan: cp.plan, companyName: cp.companyName || undefined, convertToEmployer: cp.convertToEmployer },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`${res.data!.company.name} now has a complimentary ${cp.plan === "PROFESSIONAL" ? "Professional" : "Starter"} plan.`);
    setCp({ email: "", plan: "PROFESSIONAL", companyName: "", convertToEmployer: false });
    load();
  }

  async function revokeComp(c: CompAccount) {
    if (!confirm(`End the complimentary plan for ${c.company}? They move to the free tier; their data is kept.`)) return;
    const res = await api("/api/admin/complimentary", { method: "DELETE", json: { companyId: c.companyId } });
    if (!res.ok) return setError(res.error);
    load();
  }

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full access accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            One login that can switch between the job seeker, employer (Recruiter Suite) and platform admin views, with Elite + both add-ons and
            Enterprise Professional — free, no expiry.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); grantFull(); }}>
            <Input type="email" placeholder="Account email" value={fa.email} onChange={(e) => setFa({ ...fa, email: e.target.value })} />
            <Input placeholder="Company name (if they have none yet)" value={fa.companyName} onChange={(e) => setFa({ ...fa, companyName: e.target.value })} />
            <Button type="submit" disabled={busy || !fa.email.trim()}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Grant full access</Button>
          </form>
          {!full ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : full.length === 0 ? (
            <p className="text-sm text-muted-foreground">No full-access accounts.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {full.map((u) => (
                <div key={u.userId} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-foreground">{u.name} · <span className="text-muted-foreground">{u.email}</span></p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline">Admin</Badge>
                      <Badge variant="outline">Job seeker {u.candidatePlan ?? "Free"}</Badge>
                      <Badge variant="outline">{u.company ?? "No company"} · {u.enterprisePlan ?? "no plan"}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revokeFull(u)}>Remove</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complimentary company plans</CardTitle>
          <p className="text-sm text-muted-foreground">A Recruiter Suite plan at no charge and with no expiry. Credits reset on the 1st of each month.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); grantComp(); }}>
            <Input type="email" placeholder="Employer account email" value={cp.email} onChange={(e) => setCp({ ...cp, email: e.target.value })} />
            <select aria-label="Plan" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={cp.plan} onChange={(e) => setCp({ ...cp, plan: e.target.value })}>
              <option value="PROFESSIONAL">Professional ($999 value)</option>
              <option value="STARTER">Starter ($499 value)</option>
            </select>
            <Input placeholder="Company name (if they have none yet)" value={cp.companyName} onChange={(e) => setCp({ ...cp, companyName: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={cp.convertToEmployer} onChange={(e) => setCp({ ...cp, convertToEmployer: e.target.checked })} />
              Switch a job seeker account to an employer account
            </label>
            <Button type="submit" className="sm:col-span-2" disabled={busy || !cp.email.trim()}>Grant complimentary plan</Button>
          </form>
          {!comps ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : comps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complimentary plans.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {comps.map((c) => (
                <div key={c.companyId} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-foreground">{c.company} · <span className="text-muted-foreground">{c.plan === "PROFESSIONAL" ? "Professional" : "Starter"}{c.owner ? ` · ${c.owner}` : ""}</span></span>
                  <Button size="sm" variant="ghost" onClick={() => revokeComp(c)}>End</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
