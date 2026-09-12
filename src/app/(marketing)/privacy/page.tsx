import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Career OS collects, uses, and protects your data.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect",
    body: [
      "Account information: your name, email address, and password (stored as a salted hash — we never store or see your plaintext password).",
      "Career Profile data: resume content, work experience, education, skills, salary and location preferences, and anything else you add to build your profile.",
      "Application activity: jobs you view, save, or apply to, resumes and cover letters generated for them, and Auto Apply run history.",
      "Interview AI sessions: your practice answers and the resulting feedback, stored so you can track progress over time.",
      "Billing data: your subscription plan and status. Payment details (card numbers, etc.) are handled entirely by PayPal — we never receive or store them.",
      "Chrome extension data: if you install it, the extension syncs with your Career OS account to read job postings on pages you visit and submit the tailored application packages you approve.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To run the product: matching you to jobs, generating resumes and cover letters, scoring ATS compatibility, running Interview AI sessions, and calculating your Career Readiness score.",
      "To operate Auto Apply strictly within the preferences and safety gates you set — we never use your data to apply anywhere you haven't authorized.",
      "To send account, security, and billing emails (password resets, subscription confirmations). We don't send marketing email you haven't opted into.",
      "To improve matching and scoring quality. We do not sell your personal data to third parties, ever.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "PayPal processes subscription payments and never shares your full payment details with us.",
      "Adzuna and JSearch supply external job listings that Career OS aggregates and normalizes alongside employer-posted jobs.",
      "An AI provider (OpenAI, OpenRouter, or Anthropic, depending on configuration) processes the text you submit for resume rewrites, cover letters, Job GPT conversations, and Interview AI feedback, solely to generate that response.",
    ],
  },
  {
    title: "Your controls",
    body: [
      "You can edit or delete any part of your Career Profile at any time from your account settings.",
      "You can disconnect the Chrome extension at any time from Settings → Connected browsers.",
      "You can cancel your subscription at any time from Settings → Billing; cancellation takes effect at the end of your current billing period.",
      "To request a full export or deletion of your account data, contact us at the address below.",
    ],
  },
  {
    title: "Data retention & security",
    body: [
      "We retain your data for as long as your account is active, plus a reasonable period afterward to comply with legal and billing obligations, unless you request earlier deletion.",
      "Passwords are hashed, sessions are signed, and all traffic is served over HTTPS. No system is perfectly secure, and we work to keep ours current with practical safeguards.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" align="left" />
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
              </a>{" "}
              for anything about your data or this policy.
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
