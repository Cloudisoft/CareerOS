import type { Metadata } from "next";
import Link from "next/link";
import { Mail, BookOpen, Puzzle, ShieldCheck, CreditCard, Mic } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with your CareerOS account, plans, and the Auto Apply and Interview Prep Chrome extensions.",
  alternates: { canonical: "/support" },
};

/** The inbox people write to. Set NEXT_PUBLIC_SUPPORT_EMAIL to change it without a code change. */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@careeros.app";

const TOPICS = [
  {
    icon: CreditCard,
    title: "Account, plans and billing",
    items: [
      "Change or cancel your plan any time in Settings → Billing; payments go through PayPal.",
      "Can't sign in? Use “Forgot password” on the login page, or sign in with Google using the same email.",
      "Joined through a CareerOS partner or event? Your access is set up for you; write to us if something is missing.",
    ],
  },
  {
    icon: Puzzle,
    title: "Chrome extensions",
    items: [
      "Install Auto Apply or Interview Prep from the Chrome Web Store, click its icon and press Sign in. It uses your CareerOS account.",
      "If an extension stops working after an update, open chrome://extensions, turn it off and on, then reload the page you're on.",
      "Auto Apply asks you once for answers only you can give, then remembers them for later applications.",
    ],
  },
  {
    icon: Mic,
    title: "Interview Prep and Live Copilot",
    items: [
      "Mock interviews read your resume first: keep your primary resume in Resume Studio up to date for better questions.",
      "Live Copilot only works on Google Meet, Zoom or Teams calls joined in Chrome, and only after you press Start in the extension.",
      "Nothing showing during a call? Use “Test call” in the extension's popup to check it can hear the call audio.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Privacy and your data",
    items: [
      "Live Copilot never stores call audio or transcripts; see the Privacy Policy for what is kept and why.",
      "To get a copy of your data or have your account deleted, email us from the address on your account.",
    ],
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero eyebrow="Support" title="How can we help?" align="left" />
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Mail className="h-5 w-5 text-primary" /> Email support
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Write from the email on your CareerOS account and tell us what you were doing and what you saw. A screenshot helps.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("CareerOS support")}`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-gradient px-5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2" stagger={0.05}>
          {TOPICS.map(({ icon: Icon, title, items }) => (
            <RevealItem key={title} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon className="h-5 w-5 text-primary" /> {title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {items.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/faq" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <BookOpen className="h-4 w-4" /> Frequently asked questions
          </Link>
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </>
  );
}
