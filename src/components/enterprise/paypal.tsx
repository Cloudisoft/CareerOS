"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/* Minimal shapes of the PayPal JS SDK globals — there is no official types package. */
interface ButtonsInstance {
  render: (el: HTMLElement) => Promise<void>;
  close?: () => void;
}
interface OrdersSdk {
  Buttons: (config: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => ButtonsInstance;
}
interface SubscriptionsSdk {
  Buttons: (config: {
    createSubscription: (data: unknown, actions: { subscription: { create: (o: { plan_id: string; custom_id: string }) => Promise<string> } }) => Promise<string>;
    onApprove: (data: { subscriptionID?: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => ButtonsInstance;
}

/** Loads the SDK under its own namespace, so the subscription and one-off checkout SDKs never clash. */
function loadSdk<T>(namespace: string, clientId: string, query: string): Promise<T> {
  const w = window as unknown as Record<string, T | undefined>;
  if (w[namespace]) return Promise.resolve(w[namespace]!);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&${query}`;
    script.setAttribute("data-namespace", namespace);
    script.onload = () => (w[namespace] ? resolve(w[namespace]!) : reject(new Error("PayPal failed to load.")));
    script.onerror = () => reject(new Error("PayPal failed to load. Check your connection or disable blockers for paypal.com."));
    document.body.appendChild(script);
  });
}

/** One-off PayPal checkout (boosts). `createOrder` must return the server-created order id. */
export function PayPalOrderButton({
  clientId,
  createOrder,
  onApproved,
  onError,
}: {
  clientId: string;
  createOrder: () => Promise<string>;
  onApproved: (orderId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const handlers = useRef({ createOrder, onApproved, onError });
  handlers.current = { createOrder, onApproved, onError };

  useEffect(() => {
    let instance: ButtonsInstance | null = null;
    let cancelled = false;
    loadSdk<OrdersSdk>("paypalOrders", clientId, "intent=capture&currency=USD&components=buttons")
      .then((sdk) => {
        if (cancelled || !ref.current) return;
        instance = sdk.Buttons({
          createOrder: () => handlers.current.createOrder(),
          onApprove: (data) => handlers.current.onApproved(data.orderID),
          onError: () => handlers.current.onError("PayPal reported an error. You were not charged."),
        });
        return instance.render(ref.current);
      })
      .catch((e: Error) => handlers.current.onError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      instance?.close?.();
    };
  }, [clientId]);

  return (
    <div>
      {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />}
      <div ref={ref} />
    </div>
  );
}

/** PayPal subscribe button for a server-chosen plan id. */
export function PayPalSubscribeButton({
  clientId,
  planId,
  customId,
  onApproved,
  onError,
}: {
  clientId: string;
  planId: string;
  customId: string;
  onApproved: (subscriptionId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const handlers = useRef({ onApproved, onError });
  handlers.current = { onApproved, onError };

  useEffect(() => {
    let instance: ButtonsInstance | null = null;
    let cancelled = false;
    loadSdk<SubscriptionsSdk>("paypalSubscriptions", clientId, "vault=true&intent=subscription&components=buttons")
      .then((sdk) => {
        if (cancelled || !ref.current) return;
        instance = sdk.Buttons({
          createSubscription: (_d, actions) => actions.subscription.create({ plan_id: planId, custom_id: customId }),
          onApprove: async (data) => {
            if (data.subscriptionID) await handlers.current.onApproved(data.subscriptionID);
          },
          onError: () => handlers.current.onError("PayPal reported an error. You were not charged."),
        });
        return instance.render(ref.current);
      })
      .catch((e: Error) => handlers.current.onError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      instance?.close?.();
    };
  }, [clientId, planId, customId]);

  return (
    <div>
      {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />}
      <div ref={ref} />
    </div>
  );
}
