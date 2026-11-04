"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, ErrorBanner, SuccessBanner } from "@/components/enterprise/shared";

interface Publisher {
  id: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyMemberships: { role: string; company: { name: string } }[];
  };
}

const ROLE_LABEL: Record<string, string> = {
  CANDIDATE: "Job seeker account",
  EMPLOYER: "Employer account",
  COMPANY_ADMIN: "Employer account",
  PLATFORM_ADMIN: "Platform admin",
};
interface BillingStatus {
  configured: boolean;
  env: string;
  webhookConfigured: boolean;
  plans: Record<string, string>;
}

const VARIANTS = ["STARTER", "PROFESSIONAL", "STARTER_INTRO", "PROFESSIONAL_INTRO"];

export default function AdminEnterprisePage() {
  const [publishers, setPublishers] = useState<Publisher[] | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([
      api<{ publishers: Publisher[] }>("/api/admin/careers-publishers"),
      api<BillingStatus>("/api/admin/enterprise-billing"),
    ]);
    if (!p.ok || !b.ok) return setError(p.error ?? b.error);
    setPublishers(p.data!.publishers);
    setBilling(b.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function grant() {
    setBusy(true);
    setError(null);
    const res = await api("/api/admin/careers-publishers", { method: "POST", json: { email } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`${email} can now publish to Career OS Careers.`);
    setEmail("");
    load();
  }

  async function revoke(p: Publisher) {
    if (!confirm(`Remove publishing access for ${p.user.email}?`)) return;
    const res = await api("/api/admin/careers-publishers", { method: "DELETE", json: { userId: p.userId } });
    if (!res.ok) return setError(res.error);
    load();
  }

  async function createPlans() {
    if (!billing) return;
    if (!confirm(`Create the Enterprise product and plans in PayPal (${billing.env.toUpperCase()})? Existing ones are skipped.`)) return;
    setBusy(true);
    setError(null);
    const res = await api<{ created: string[] }>("/api/admin/enterprise-billing", { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(res.data!.created.length ? `Created in PayPal: ${res.data!.created.join(", ")}.` : "All plans already existed — nothing created.");
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Enterprise & Careers</h1>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Career OS Careers publishers</CardTitle>
          <p className="text-sm text-muted-foreground">Only these accounts can create, edit or remove Career OS Careers listings.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); grant(); }}>
            <Input type="email" placeholder="Account email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" disabled={busy || !email.trim()}>Grant access</Button>
          </form>
          {!publishers ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : publishers.length === 0 ? (
            <p className="text-sm text-warning">No publisher assigned yet — nobody can post to Career OS Careers until you add one.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {publishers.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-foreground">{p.user.firstName} {p.user.lastName} · <span className="text-muted-foreground">{p.user.email}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[p.user.role] ?? p.user.role}
                      {p.user.companyMemberships[0] ? ` · ${p.user.companyMemberships[0].company.name}` : ""}
                      {" · posts from the "}<span className="text-foreground">Manage Careers</span>{" menu item"}
                    </p>
                    {(p.user.role === "EMPLOYER" || p.user.role === "COMPANY_ADMIN") && !p.user.companyMemberships[0] && (
                      <p className="text-xs text-warning">Hasn&apos;t created a company yet — Recruiter Suite opens once they do (Company in the menu).</p>
                    )}
                    {p.user.role !== "EMPLOYER" && p.user.role !== "COMPANY_ADMIN" && (
                      <p className="text-xs text-warning">Recruiter Suite is only available on employer accounts.</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revoke(p)}>Remove</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enterprise billing (PayPal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!billing ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={billing.configured ? "success" : "destructive"}>{billing.configured ? "PayPal credentials set" : "PayPal not configured"}</Badge>
                <Badge variant="outline">Mode: {billing.env}</Badge>
                <Badge variant={billing.webhookConfigured ? "success" : "warning"}>{billing.webhookConfigured ? "Webhook id set" : "PAYPAL_WEBHOOK_ID missing"}</Badge>
              </div>
              <div className="divide-y divide-border">
                {VARIANTS.map((v) => (
                  <div key={v} className="flex justify-between py-1.5">
                    <span className="text-foreground">{v.replace("_", " ")}</span>
                    <span className="font-mono text-xs text-muted-foreground">{billing.plans[v] ?? "not created"}</span>
                  </div>
                ))}
              </div>
              <Button disabled={busy || !billing.configured || VARIANTS.every((v) => billing.plans[v])} onClick={createPlans}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create plans in PayPal
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
