/**
 * Central plan + entitlement catalog. Phase 5 (Stripe) maps each plan's
 * `stripePriceId` env var to these same keys — this file is the one source
 * of truth for what a plan includes, referenced by both marketing pricing
 * UI and server-side entitlement checks.
 */

export type PlanKey = "BASIC" | "STANDARD" | "PREMIUM" | "ELITE";
export type AddOnKey = "RESUME_STUDIO" | "INTERVIEW_AI";

export interface Entitlements {
  autoApply: boolean;
  dailyApplicationLimit: number;
  jobGpt: boolean;
  resumeOptimization: boolean;
  atsScanner: boolean;
  interviewAi: boolean;
  learning: boolean;
  networkFeatures: boolean;
}

export interface Plan {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  bestFor: string;
  features: string[];
  entitlements: Entitlements;
  recommended?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "BASIC",
    name: "Basic",
    priceMonthly: 19,
    bestFor: "Getting your Career Profile and job search off the ground.",
    features: [
      "Full Career Profile & Career Readiness score",
      "Job matching & manual apply",
      "Assisted Apply autofill",
      "Job GPT (limited)",
    ],
    entitlements: {
      autoApply: false,
      dailyApplicationLimit: 0,
      jobGpt: true,
      resumeOptimization: false,
      atsScanner: true,
      interviewAi: false,
      learning: false,
      networkFeatures: true,
    },
  },
  {
    key: "STANDARD",
    name: "Standard",
    priceMonthly: 49,
    bestFor: "Active job seekers who want automation without limits on match quality.",
    features: [
      "Everything in Basic",
      "Auto Apply — 5 applications/day",
      "AI resume optimization",
      "Full Job GPT access",
      "Learning Hub access",
    ],
    entitlements: {
      autoApply: true,
      dailyApplicationLimit: 5,
      jobGpt: true,
      resumeOptimization: true,
      atsScanner: true,
      interviewAi: false,
      learning: true,
      networkFeatures: true,
    },
  },
  {
    key: "PREMIUM",
    name: "Premium",
    priceMonthly: 99,
    bestFor: "Candidates who want maximum reach and interview-ready confidence.",
    features: [
      "Everything in Standard",
      "Auto Apply — 10 applications/day",
      "Interview AI included",
      "Career Intelligence insights",
    ],
    entitlements: {
      autoApply: true,
      dailyApplicationLimit: 10,
      jobGpt: true,
      resumeOptimization: true,
      atsScanner: true,
      interviewAi: true,
      learning: true,
      networkFeatures: true,
    },
    recommended: true,
  },
  {
    key: "ELITE",
    name: "Elite",
    priceMonthly: 149,
    bestFor: "Executive and specialized searches that need the highest daily volume.",
    features: [
      "Everything in Premium",
      "Auto Apply — 20 applications/day",
      "Priority AI processing",
      "Dedicated career intelligence reports",
    ],
    entitlements: {
      autoApply: true,
      dailyApplicationLimit: 20,
      jobGpt: true,
      resumeOptimization: true,
      atsScanner: true,
      interviewAi: true,
      learning: true,
      networkFeatures: true,
    },
  },
];

export const ADD_ONS: { key: AddOnKey; name: string; price: number; period: "month" | "year"; description: string }[] = [
  {
    key: "RESUME_STUDIO",
    name: "Resume Studio",
    price: 2.99,
    period: "month",
    description: "Unlimited AI-assisted resume versions, templates, and exports.",
  },
  {
    key: "INTERVIEW_AI",
    name: "Interview AI",
    price: 199,
    period: "year",
    description: "Unlimited adaptive interview practice sessions with detailed scoring.",
  },
];

export function getPlan(key: PlanKey) {
  const plan = PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown plan: ${key}`);
  return plan;
}
