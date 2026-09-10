"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
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
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    return fetch("/api/billing/status")
      .then((r) => r.json())
      .then((json) => setStatus(json.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function checkout(plan: PlanKey) {
    router.push(`/checkout?kind=plan&key=${plan}`);
  }

  function checkoutAddOn(addOn: AddOnKey) {
    router.push(`/checkout?kind=addon&key=${addOn}`);
  }

  async function cancelPlan() {
    if (!confirm("Cancel your plan? You'll keep access until the current billing period ends.")) return;
    setBusy("plan");
    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "plan" }),
    });
    const json = await res.json();
    setBusy(null);
    if (res.ok) load();
    else alert(json.error?.message ?? "Could not cancel your plan.");
  }

  async function cancelAddOn(addOn: AddOnKey) {
    if (!confirm("Cancel this add-on? You'll keep access until the current billing period ends.")) return;
    setBusy(addOn);
    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: addOn }),
    });
    const json = await res.json();
    setBusy(null);
    if (res.ok) load();
    else alert(json.error?.message ?? "Could not cancel this add-on.");
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
            Billing isn't configured in this environment. Checkout will show an error until PayPal keys are set.
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
              {status?.subscription?.cancelAtPeriodEnd ? " · canceling at period end" : ""}
            </CardDescription>
          </div>
          {status?.subscription && !status.subscription.cancelAtPeriodEnd && (
            <Button variant="secondary" onClick={cancelPlan} disabled={busy === "plan"}>
              {busy === "plan" && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel plan
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
                    disabled={isCurrent}
                    onClick={() => checkout(plan.key)}
                  >
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
                  {active ? (
                    <Button variant="secondary" disabled={busy === addon.key} onClick={() => cancelAddOn(addon.key)}>
                      {busy === addon.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Active — cancel"}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => checkoutAddOn(addon.key)}>
                      Add
                    </Button>
                  )}
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
        href="https://www.paypal.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Payments securely processed by PayPal <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
