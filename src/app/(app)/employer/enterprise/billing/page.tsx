"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, useEnterprise, ErrorBanner, SuccessBanner, Modal, fmtDate, usd, STATUS_LABEL, type EnterpriseOverview } from "@/components/enterprise/shared";
import { PayPalSubscribeButton } from "@/components/enterprise/paypal";

interface Checkout {
  clientId: string;
  planId: string;
  customId: string;
  intro: boolean;
}
interface Invoice {
  id: string;
  type: string;
  amountCents: number | null;
  detail: string | null;
  createdAt: string;
  plan: string | null;
}

const PLAN_NAME = { STARTER: "Starter", PROFESSIONAL: "Professional" } as const;

function features(p: EnterpriseOverview["plans"][number]) {
  const e = p.entitlements;
  return [
    `${e.jobsPerDay} job posts per day`,
    `${e.resumeCredits} resume unlocks per month`,
    `${e.inmailCredits} InMail credits per month`,
    "AI ATS screening",
    "Candidate messaging & pipeline",
    "Unlimited job announcements",
    ...(e.freePostBoosts ? [`${e.freePostBoosts} free post boost per month`] : []),
    ...(e.freeCampaignBoosts ? [`${e.freeCampaignBoosts} free campaign boost per month`] : []),
    "Pay-as-you-go boosts",
  ];
}

function BillingInner() {
  const params = useSearchParams();
  const { overview, refresh } = useEnterprise();
  const [checkout, setCheckout] = useState<(Checkout & { plan: "STARTER" | "PROFESSIONAL" }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(params.get("downgrade") ? "Plan change approved in PayPal. It takes effect at your next renewal." : null);
  const [busy, setBusy] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  // A ref, not state: set before the request goes out, so checkout is only started once.
  const autoStarted = useRef(false);

  useEffect(() => {
    api<{ events: Invoice[] }>("/api/enterprise/usage").then((r) => r.ok && setInvoices(r.data!.events.filter((e) => e.type === "PAYMENT" || e.type === "BOOST_PURCHASED")));
  }, []);

  // Arriving from "Pay now" on the Pricing page (?plan=STARTER): open PayPal checkout for that plan straight away.
  const wanted = params.get("plan");
  useEffect(() => {
    if (!overview || autoStarted.current || (wanted !== "STARTER" && wanted !== "PROFESSIONAL")) return;
    const o = overview;
    const active = o.plan && (o.status === "ACTIVE" || o.status === "PAST_DUE");
    if (!o.canManageBilling || o.complimentary || active) return;
    autoStarted.current = true;
    void startCheckout(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview, wanted]);

  if (!overview) return null;
  const o = overview;
  const hasAccess = o.plan && (o.status === "ACTIVE" || o.status === "PAST_DUE" || (o.status === "CANCELLED" && o.period.end && new Date(o.period.end) > new Date()));
  const currentPrice = o.plan ? o.plans.find((p) => p.key === o.plan)!.priceCents : 0;

  async function startCheckout(plan: "STARTER" | "PROFESSIONAL") {
    setError(null);
    setBusy(true);
    const res = await api<Checkout>(`/api/enterprise/billing/checkout?plan=${plan}`);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setCheckout({ ...res.data!, plan });
  }

  async function approved(subscriptionID: string) {
    setBusy(true);
    const res = await api("/api/enterprise/billing/confirm", { method: "POST", json: { subscriptionID } });
    setBusy(false);
    setCheckout(null);
    if (!res.ok) return setError(res.error);
    setNotice("You're subscribed. Your allowances are ready to use.");
    refresh();
  }

  async function downgrade(plan: "STARTER" | "PROFESSIONAL") {
    if (!confirm(`Switch to ${PLAN_NAME[plan]} at your next renewal${o.period.end ? ` (${fmtDate(o.period.end)})` : ""}? You keep your current plan until then.`)) return;
    setBusy(true);
    const res = await api<{ approveUrl: string | null }>("/api/enterprise/billing/downgrade", { method: "POST", json: { plan } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.data!.approveUrl) window.location.href = res.data!.approveUrl;
    else {
      setNotice("Plan change requested. It takes effect at your next renewal.");
      refresh();
    }
  }

  async function cancel() {
    if (!confirm(`Cancel your subscription? You keep full access until ${fmtDate(o.period.end)}, then move to the free tier. Your data is kept.`)) return;
    setBusy(true);
    const res = await api("/api/enterprise/billing/cancel", { method: "POST", json: {} });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`Subscription cancelled. You have access until ${fmtDate(o.period.end)}.`);
    refresh();
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}
      {!o.canManageBilling && <ErrorBanner message="Only your company's owner or admins can change the subscription." />}

      <Card>
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current status</p>
            <p className="text-lg font-semibold text-foreground">
              {o.plan && hasAccess ? `${PLAN_NAME[o.plan]} · ` : ""}{STATUS_LABEL[o.status]}
            </p>
            {o.status === "TRIAL" && <p className="text-sm text-muted-foreground">Trial ends {fmtDate(o.trial.endsAt)}, then you move to the free tier.</p>}
            {o.complimentary && (
              <p className="text-sm text-muted-foreground">
                Complimentary plan from Career OS — no charge{o.period.end ? `, active until ${fmtDate(o.period.end)}` : ", no end date"}. Credits reset on the 1st of each month (UTC).
              </p>
            )}
            {o.status === "ACTIVE" && o.period.end && !o.complimentary && (
              <p className="text-sm text-muted-foreground">
                {o.intro.active ? `This month billed at the ${usd(o.intro.priceCents)} intro price. ` : ""}
                Renews {fmtDate(o.period.end)} at {usd(currentPrice)}/month.
              </p>
            )}
            {o.status === "CANCELLED" && <p className="text-sm text-muted-foreground">Cancelled — access until {fmtDate(o.period.end)}.</p>}
            {o.pendingDowngrade && <p className="text-sm text-muted-foreground">Switching to {PLAN_NAME[o.pendingDowngrade.plan as "STARTER"]} at renewal.</p>}
          </div>
          {o.canManageBilling && !o.complimentary && (o.status === "ACTIVE" || o.status === "PAST_DUE") && (
            <Button variant="outline" disabled={busy} onClick={cancel}>Cancel subscription</Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {o.plans.map((p) => {
          const current = o.plan === p.key && hasAccess && o.status !== "CANCELLED";
          const isUpgrade = hasAccess && o.status !== "CANCELLED" && p.priceCents > currentPrice;
          const isDowngrade = hasAccess && o.status !== "CANCELLED" && p.priceCents < currentPrice;
          return (
            <Card key={p.key} className={current ? "border-primary/50" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {current && <Badge variant="brand">Current plan</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </CardHeader>
              <CardContent>
                {o.intro.eligible && !hasAccess ? (
                  <div>
                    <p className="text-3xl font-semibold text-foreground">{usd(p.introPriceCents)}<span className="text-base font-normal text-muted-foreground"> first month</span></p>
                    <p className="text-sm text-muted-foreground">then {usd(p.priceCents)}/month · cancel anytime</p>
                  </div>
                ) : (
                  <p className="text-3xl font-semibold text-foreground">{usd(p.priceCents)}<span className="text-base font-normal text-muted-foreground">/month</span></p>
                )}
                <ul className="mt-4 space-y-1.5 text-sm">
                  {features(p).map((f) => (
                    <li key={f} className="flex gap-2 text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
                  ))}
                </ul>
                {o.canManageBilling && !current && !o.complimentary && (
                  <div className="mt-5">
                    {isDowngrade ? (
                      <Button variant="outline" className="w-full" disabled={busy || Boolean(o.pendingDowngrade)} onClick={() => downgrade(p.key)}>
                        {o.pendingDowngrade ? "Downgrade scheduled" : `Downgrade at renewal`}
                      </Button>
                    ) : (
                      <Button className="w-full" disabled={busy} onClick={() => startCheckout(p.key)}>
                        {isUpgrade ? `Upgrade — ${usd(p.priceCents)} today` : o.intro.eligible && !hasAccess ? `Start for ${usd(p.introPriceCents)}` : `Subscribe — ${usd(p.priceCents)}/month`}
                      </Button>
                    )}
                    {isUpgrade && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Upgrading starts a new {PLAN_NAME[p.key]} subscription today with a fresh monthly allowance, and cancels your current one. Unused days on your current plan aren't refunded.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader>
        <CardContent>
          {!invoices ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet. PayPal emails a receipt for every payment.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {invoices.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-foreground">{fmtDate(i.createdAt)} · {i.type === "PAYMENT" ? `Subscription${i.plan ? ` (${PLAN_NAME[i.plan as "STARTER"]})` : ""}` : "Boost"}</span>
                  <span className="text-muted-foreground">{i.detail ? `PayPal ${i.detail.split(" · ")[0]}` : ""}</span>
                  <span className="font-medium tabular-nums text-foreground">{i.amountCents != null ? usd(i.amountCents) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={Boolean(checkout)} onClose={() => setCheckout(null)} title={checkout ? `Subscribe to ${PLAN_NAME[checkout.plan]}` : ""}>
        {checkout && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {checkout.intro
                ? `You'll pay ${usd(o.intro.priceCents)} today for your first month, then ${usd(o.plans.find((p) => p.key === checkout.plan)!.priceCents)}/month. Cancel anytime.`
                : `You'll pay ${usd(o.plans.find((p) => p.key === checkout.plan)!.priceCents)} today and every month after. Cancel anytime.`}
            </p>
            <PayPalSubscribeButton clientId={checkout.clientId} planId={checkout.planId} customId={checkout.customId} onApproved={approved} onError={(m) => setError(m)} />
            {busy && <p className="text-sm text-muted-foreground">Confirming with PayPal…</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingInner />
    </Suspense>
  );
}
