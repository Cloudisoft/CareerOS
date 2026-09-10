"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, ADD_ONS } from "@/lib/billing/plans";

/** Minimal shape of the global `paypal` object the JS SDK script attaches — no official types package for it. */
interface PayPalSubscriptionActions {
  subscription: { create(options: { plan_id: string; custom_id?: string }): Promise<string> };
}
interface PayPalButtonsConfig {
  createSubscription: (data: unknown, actions: PayPalSubscriptionActions) => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => void;
  onError?: (err: unknown) => void;
}
interface PayPalGlobal {
  Buttons: (config: PayPalButtonsConfig) => { render: (selector: string) => void };
}

function loadPayPalScript(clientId: string): Promise<PayPalGlobal> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { paypal?: PayPalGlobal }).paypal;
    if (existing) return resolve(existing);

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
    script.onload = () => {
      const loaded = (window as unknown as { paypal?: PayPalGlobal }).paypal;
      if (loaded) resolve(loaded);
      else reject(new Error("PayPal SDK failed to load."));
    };
    script.onerror = () => reject(new Error("PayPal SDK failed to load."));
    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind") === "addon" ? "addon" : "plan";
  const key = searchParams.get("key") ?? "";

  const [status, setStatus] = useState<"loading" | "ready" | "confirming" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const rendered = useRef(false);

  const label =
    kind === "plan"
      ? PLANS.find((p) => p.key === key)?.name
      : ADD_ONS.find((a) => a.key === key)?.name;

  useEffect(() => {
    if (!key || rendered.current) return;
    rendered.current = true;

    (async () => {
      try {
        const catalogRes = await fetch(`/api/billing/paypal/catalog?kind=${kind}&key=${encodeURIComponent(key)}`);
        const catalogJson = await catalogRes.json();
        if (!catalogRes.ok) throw new Error(catalogJson.error?.message ?? "Could not start checkout.");
        const { clientId, planId, userId } = catalogJson.data;

        const paypal = await loadPayPalScript(clientId);
        setStatus("ready");

        paypal
          .Buttons({
            createSubscription: (_data, actions) => actions.subscription.create({ plan_id: planId, custom_id: userId }),
            onApprove: async (data) => {
              if (!data.subscriptionID) return;
              setStatus("confirming");
              const confirmRes = await fetch("/api/billing/paypal/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionID: data.subscriptionID, kind, key }),
              });
              const confirmJson = await confirmRes.json();
              if (confirmRes.ok) {
                router.push("/settings/billing?checkout=success");
              } else {
                setStatus("error");
                setError(confirmJson.error?.message ?? "Could not confirm your subscription.");
              }
            },
            onError: () => {
              setStatus("error");
              setError("PayPal reported an error during checkout.");
            },
          })
          .render("#paypal-button-container");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Could not start checkout.");
      }
    })();
  }, [kind, key, router]);

  if (!key || !label) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Unknown plan.</CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/settings/billing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to billing
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscribe to {label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {status === "confirming" && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming your subscription…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div id="paypal-button-container" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
