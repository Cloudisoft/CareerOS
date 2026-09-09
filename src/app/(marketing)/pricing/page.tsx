import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, ADD_ONS } from "@/lib/billing/plans";
import { PricingCta } from "@/components/billing/pricing-cta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent Career OS plans for every stage of your job search.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Plans built for how far you want to go
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start free with your Career Profile. Upgrade when you're ready for automation.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.key}
            className={cn(
              "relative flex flex-col",
              plan.recommended && "border-primary shadow-glow"
            )}
          >
            {plan.recommended && (
              <Badge variant="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">${plan.priceMonthly}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.bestFor}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 pt-0">
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <PricingCta plan={plan.key} recommended={plan.recommended} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">Add-ons</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ADD_ONS.map((addon) => (
            <Card key={addon.key}>
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-semibold text-foreground">{addon.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{addon.description}</p>
                </div>
                <div className="whitespace-nowrap text-right">
                  <p className="font-semibold text-foreground">
                    ${addon.price}
                    <span className="text-xs text-muted-foreground">/{addon.period}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
