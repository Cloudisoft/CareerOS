import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { SUPPORT_EMAIL } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Career OS collects, uses, and protects your data, including the Chrome extensions and Live Copilot.",
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
      "Chrome extension data: if you install the Auto Apply extension, it syncs with your Career OS account to read job postings on pages you visit and submit the tailored application packages you approve. The Interview Prep extension uses your account for mock interviews and saved stories, and keeps your sign-in token and Live Copilot settings on your device.",
    ],
  },
  {
    title: "Live Copilot (Interview Prep extension)",
    body: [
      "Live Copilot is off by default. It starts only when you press Start in the Interview Prep extension while a Google Meet, Zoom or Microsoft Teams call is open in Chrome, after you have agreed to an on-screen disclosure. It stops when you press Stop, close the call tab, or leave the call.",
      "While it is on, it captures the audio the call tab plays (the other participants), not your microphone. Silent stretches are dropped on your device; short clips of speech are sent over HTTPS to Career OS.",
      "Career OS forwards each clip to a speech-to-text provider (Deepgram, or OpenAI if Deepgram is not available) to turn it into text. The text, with your resume and saved interview stories, is sent to an AI provider to decide whether a question was asked and to suggest a few talking points.",
      "Career OS does not store call audio or transcripts: each clip and its text exist only while that request is processed, then are discarded. The providers process them only to return the result, under their API terms.",
      "Some places require everyone on a call to be told that it is being transcribed or AI-assisted, and some employers do not allow AI assistance in interviews. You are responsible for telling others and for following those rules.",
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
      "An AI provider (Anthropic, OpenAI, or OpenRouter, depending on configuration) processes the text you submit for resume rewrites, cover letters, Job GPT conversations, Interview AI questions and feedback, and Live Copilot talking points, solely to generate that response.",
      "Deepgram (or OpenAI) transcribes Live Copilot audio clips into text, solely to return the transcript.",
    ],
  },
  {
    title: "Your controls",
    body: [
      "You can edit or delete any part of your Career Profile at any time from your account settings.",
      "You can disconnect the Chrome extensions at any time from Settings → Connected browsers, or remove them from Chrome.",
      "You can stop Live Copilot at any time from the panel on the call or from the extension.",
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
          <p className="text-sm text-muted-foreground">Last updated: November 7, 2026</p>
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
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              for anything about your data or this policy.
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
