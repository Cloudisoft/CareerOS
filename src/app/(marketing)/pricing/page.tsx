import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, ADD_ONS } from "@/lib/billing/plans";
import { PricingCta } from "@/components/billing/pricing-cta";
import { EnterprisePricingCta } from "@/components/billing/enterprise-pricing-cta";
import { ENTERPRISE_PLANS, INTRO_PRICE_CENTS, TRIAL_DAYS, formatUsd, type EnterprisePlan } from "@/lib/enterprise/plans";
import { PageHero } from "@/components/marketing/page-hero";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing for job seekers and employers",
  description:
    "CareerOS pricing: free and paid plans for job seekers, and the Recruiter Suite for employers at $499 or $999 a month — $199 for your first month, with a 3-day free trial.",
  alternates: { canonical: "/pricing" },
};

/** What each Recruiter Suite plan includes, from the same allowances the server enforces. */
function employerFeatures(p: EnterprisePlan) {
  const e = p.entitlements;
  return [
    `${e.jobsPerDay} job posts per day`,
    `${e.resumeCredits} resume unlocks per month`,
    `${e.inmailCredits} InMail credits per month`,
    "AI ATS screening of every applicant",
    "Candidate messaging & pipeline",
    "Unlimited job announcements",
    ...(e.freePostBoosts ? [`${e.freePostBoosts} free post boost per month`] : []),
    ...(e.freeCampaignBoosts ? [`${e.freeCampaignBoosts} free campaign boost per month`] : []),
    "Pay-as-you-go boosts",
  ];
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans built for how far you want to go"
        description="Start free with your Career Profile. Upgrade when you're ready for automation. Hiring? The Recruiter Suite is below."
      />

      <nav aria-label="Pricing for" className="mx-auto -mt-4 flex w-fit gap-1 rounded-full border border-border bg-surface p-1 text-sm font-semibold shadow-sm">
        <a href="#job-seekers" className="rounded-full px-4 py-2 text-foreground hover:bg-surface-raised">
          Job seekers
        </a>
        <a href="#employers" className="rounded-full bg-foreground px-4 py-2 text-background hover:opacity-90">
          Employers
        </a>
      </nav>

      <div id="job-seekers" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-foreground">For job seekers</h2>
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

      <section id="employers" aria-labelledby="employers-title" className="scroll-mt-24 border-t border-border bg-surface/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <Badge variant="outline" className="mx-auto">Recruiter Suite</Badge>
            <h2 id="employers-title" className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              For employers and staffing firms
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Post jobs every day, search resumes, screen applicants with AI and message candidates — billed monthly through PayPal. Cancel anytime.
            </p>
            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Introductory offer: {formatUsd(INTRO_PRICE_CENTS)} for your first month</span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Limited slots left</span>
            </div>
          </div>

          <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2" stagger={0.08}>
            {ENTERPRISE_PLANS.map((plan) => {
              const recommended = plan.key === "PROFESSIONAL";
              return (
                <RevealItem key={plan.key}>
                  <Card
                    className={cn(
                      "relative flex h-full flex-col transition-all hover:-translate-y-1",
                      recommended ? "border-primary shadow-[0_0_50px_rgba(239,134,45,0.18)]" : "hover:border-primary/40"
                    )}
                  >
                    {recommended && (
                      <Badge variant="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Best for teams
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight text-foreground">{formatUsd(plan.introPriceCents)}</span>
                        <span className="text-sm text-muted-foreground">first month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        then <span className="font-semibold text-foreground">{formatUsd(plan.priceCents)}/month</span> · cancel anytime
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-5 pt-0">
                      <ul className="flex-1 space-y-3">
                        {employerFeatures(plan).map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-2">
                        <EnterprisePricingCta plan={plan.key} action="pay" recommended={recommended} />
                        <EnterprisePricingCta plan={plan.key} action="trial" />
                      </div>
                    </CardContent>
                  </Card>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <div className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{TRIAL_DAYS}-day free trial.</span> Post a job a day for {TRIAL_DAYS} days, no card needed.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Secure PayPal checkout.</span> Pay with PayPal or a card; PayPal emails a receipt every month.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Cancel anytime.</span> Keep access until the end of the month you paid for.
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Want to see it first? <Link href="/employers" className="font-semibold text-primary hover:underline">Tour the Recruiter Suite</Link>
          </p>
        </div>
      </section>
    </>
  );
}
