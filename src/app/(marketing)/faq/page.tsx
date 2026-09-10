import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about Career OS.",
};

const FAQS = [
  {
    q: "What is Auto Apply, exactly?",
    a: "Auto Apply is an automation layer that discovers jobs matching the preferences you set, checks them against safety gates (match threshold, location, salary, work authorization, duplicates), and applies on your behalf using your selected resume. Anything ambiguous — an unfamiliar legal question, a CAPTCHA, a required login — is routed back to you as \"Needs Review\" instead of being guessed at.",
  },
  {
    q: "Will Career OS ever fabricate information on an application?",
    a: "No. Career OS never invents facts about your employment, education, certifications, visa status, salary history, or achievements. If a question requires information it doesn't have, it stops and asks you.",
  },
  {
    q: "Does Career OS bypass CAPTCHAs or logins?",
    a: "No. When a CAPTCHA, MFA challenge, or third-party login is required, Career OS pauses and asks you to complete it, then continues where technically supported.",
  },
  {
    q: "How is my Career Readiness score calculated?",
    a: "It's a composite of your resume strength, profile completeness, skills coverage, interview performance, and job match quality — all computed from your actual data, recalculated as you update your profile.",
  },
  {
    q: "Can I cancel or change my plan?",
    a: "Yes, anytime, from your billing settings. Plan changes go through PayPal and your entitlements update automatically.",
  },
  {
    q: "Does the Chrome extension use a separate account?",
    a: "No. The extension authenticates against your same Career OS account and shares your Career Profile, resumes, and Auto Apply settings.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Frequently asked questions</h1>
      <div className="mt-10 divide-y divide-border">
        {FAQS.map((item) => (
          <div key={item.q} className="py-6">
            <h2 className="text-base font-semibold text-foreground">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
