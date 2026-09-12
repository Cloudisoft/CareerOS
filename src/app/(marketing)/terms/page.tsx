import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Career OS.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Your account",
    body: [
      "You must provide accurate information when creating your account and keep your login credentials confidential.",
      "You're responsible for activity that happens under your account, including anything Auto Apply does on your behalf using the preferences you configured.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Career OS is for your own job search or, for employer accounts, your own hiring activity. Don't use it to scrape, resell, or redistribute job data or candidate information in bulk.",
      "Don't submit false information through the platform, attempt to circumvent Auto Apply's safety gates, or use the service in a way that violates the terms of the job boards or employer sites it interacts with.",
    ],
  },
  {
    title: "Auto Apply, honestly",
    body: [
      "Auto Apply only submits applications within the match threshold, location, salary, and other limits you set, and never bypasses a CAPTCHA, MFA challenge, or third-party login on your behalf.",
      "Auto Apply never fabricates facts about your employment, education, certifications, visa status, or salary history. Anything it can't answer from your real data is routed back to you for review.",
      "Application volume is capped by your plan's monthly Auto Apply allowance, shown on the Pricing page.",
    ],
  },
  {
    title: "Billing",
    body: [
      "Paid plans are billed through PayPal on a recurring basis until you cancel. Canceling stops future renewals; your plan remains active through the end of the period you already paid for.",
      "Add-ons (Resume Studio, Interview AI) bill independently of your base plan and can be canceled separately from Settings → Billing.",
    ],
  },
  {
    title: "Content you provide",
    body: [
      "You own your resume, profile, and other content you upload. You grant Career OS a license to process it solely to provide the service — matching, generating documents, running AI features — not for resale or unrelated purposes.",
    ],
  },
  {
    title: "Service changes and termination",
    body: [
      "We may update features or these terms over time; material changes will be reflected here with an updated date.",
      "You can close your account at any time. We may suspend accounts that violate these terms, abuse the platform, or attempt to circumvent Auto Apply's safety gates.",
    ],
  },
  {
    title: "Disclaimer",
    body: [
      "Career OS is provided \"as is.\" We work hard to make matching, scoring, and AI features accurate and useful, but we don't guarantee any specific job search outcome.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" align="left" />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Reveal>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
        </Reveal>
        <div className="mt-8 space-y-10">
          {SECTIONS.map((section, i) => (
            <Reveal key={section.title} delay={i * 0.05}>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <li key={line.slice(0, 30)} className="text-sm leading-relaxed text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal delay={SECTIONS.length * 0.05}>
            <h2 className="text-lg font-semibold text-foreground">Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Reach us at{" "}
              <a href="mailto:support@careeros.app" className="text-primary hover:underline">
                support@careeros.app
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
