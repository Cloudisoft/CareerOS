"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, ADD_ONS, type PlanKey, type AddOnKey } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/utils";

interface BillingStatus {
  entitlements: Record<string, unknown> & { addOns: AddOnKey[] };
  subscription: { plan: PlanKey; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
  payments: { id: string; amount: number; currency: string; status: string; description: string | null; createdAt: string }[];
  billingConfigured: boolean;
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((json) => setStatus(json.data))
      .finally(() => setLoading(false));
  }, []);

  async function checkout(plan: PlanKey) {
    setRedirecting(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    setRedirecting(null);
    if (res.ok && json.data.url) window.location.href = json.data.url;
    else alert(json.error?.message ?? "Could not start checkout.");
  }

  async function checkoutAddOn(addOn: AddOnKey) {
    setRedirecting(addOn);
    const res = await fetch("/api/billing/checkout-addon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addOn }),
    });
    const json = await res.json();
    setRedirecting(null);
    if (res.ok && json.data.url) window.location.href = json.data.url;
    else alert(json.error?.message ?? "Could not start checkout.");
  }

  async function openPortal() {
    setRedirecting("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    setRedirecting(null);
    if (res.ok && json.data.url) window.location.href = json.data.url;
    else alert(json.error?.message ?? "Billing portal is not available.");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = status?.subscription?.plan ?? "FREE";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your Career OS plan and add-ons.</p>
      </div>

      {status && !status.billingConfigured && (
        <Card className="border-warning/40">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Billing isn't configured in this environment. Checkout and the billing portal will show
            an error until Stripe keys are set.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Current plan</CardTitle>
            <CardDescription>
              {PLANS.find((p) => p.key === currentPlan)?.name ?? "Free"}
              {status?.subscription?.status ? ` · ${status.subscription.status}` : ""}
            </CardDescription>
          </div>
          {status?.subscription && (
            <Button variant="secondary" onClick={openPortal} disabled={redirecting === "portal"}>
              {redirecting === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Manage billing
            </Button>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <Card key={plan.key} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {plan.name}
                  {isCurrent && <Badge variant="brand">Current</Badge>}
                </CardTitle>
                <CardDescription>{formatCurrency(plan.priceMonthly)}/month</CardDescription>
              </CardHeader>
              <CardContent>
                {plan.key === "FREE" ? (
                  <Button className="w-full" variant="secondary" disabled>
                    {isCurrent ? "Current plan" : "Included"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : "primary"}
                    disabled={isCurrent || redirecting === plan.key}
                    onClick={() => checkout(plan.key)}
                  >
                    {redirecting === plan.key && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? "Current plan" : "Switch to this plan"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Add-ons</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ADD_ONS.map((addon) => {
            const active = status?.entitlements.addOns.includes(addon.key);
            return (
              <Card key={addon.key}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium text-foreground">{addon.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${addon.price}/{addon.period}
                    </p>
                  </div>
                  <Button
                    variant={active ? "secondary" : "outline"}
                    disabled={active || redirecting === addon.key}
                    onClick={() => checkoutAddOn(addon.key)}
                  >
                    {redirecting === addon.key && <Loader2 className="h-4 w-4 animate-spin" />}
                    {active ? "Active" : "Add"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {status && status.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {status.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()} · {p.description ?? "Subscription"}
                </span>
                <span className="font-medium text-foreground">{formatCurrency(p.amount / 100, p.currency.toUpperCase())}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <a
        href="https://stripe.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Payments securely processed by Stripe <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
