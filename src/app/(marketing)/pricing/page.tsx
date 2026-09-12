import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, ADD_ONS } from "@/lib/billing/plans";
import { PricingCta } from "@/components/billing/pricing-cta";
import { PageHero } from "@/components/marketing/page-hero";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent Career OS plans for every stage of your job search.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans built for how far you want to go"
        description="Start free with your Career Profile. Upgrade when you're ready for automation."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5" stagger={0.06}>
          {PLANS.map((plan) => (
            <RevealItem key={plan.key}>
              <Card
                className={cn(
                  "relative flex h-full flex-col transition-all hover:-translate-y-1",
                  plan.recommended
                    ? "border-primary shadow-[0_0_50px_rgba(239,134,45,0.18)]"
                    : "hover:border-primary/40"
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
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-foreground">Add-ons</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Independent of your plan — stack them on Free or any paid tier.
          </p>
          <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2" stagger={0.06}>
            {ADD_ONS.map((addon) => (
              <RevealItem key={addon.key}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{addon.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{addon.description}</p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap font-semibold text-foreground">
                        ${addon.price}
                        <span className="text-xs text-muted-foreground">/{addon.period}</span>
                      </p>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {addon.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </>
  );
}
