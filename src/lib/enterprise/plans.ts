/**
 * Enterprise Recruiter Suite plans. Every number a recruiter sees, and every
 * limit the server enforces, comes from here — change an allowance in one
 * place and both follow.
 */
import type { EnterprisePlanKey } from "@prisma/client";

export interface EnterpriseEntitlements {
  /** Formal job postings per UTC day. */
  jobsPerDay: number;
  /** Resume + contact unlocks per billing period. */
  resumeCredits: number;
  /** Company outreach messages per billing period. */
  inmailCredits: number;
  freePostBoosts: number;
  freeCampaignBoosts: number;
  atsScreening: boolean;
  candidateEngagement: boolean;
  resumeFetching: boolean;
  companyOutreach: boolean;
  /** Can buy extra boosts / campaigns. */
  paidBoosts: boolean;
  /** Unlimited job-announcement posts in the CareerOS feed. */
  jobAnnouncements: boolean;
}

export interface EnterprisePlan {
  key: EnterprisePlanKey;
  name: string;
  priceCents: number;
  introPriceCents: number;
  tagline: string;
  entitlements: EnterpriseEntitlements;
}

export const INTRO_PRICE_CENTS = 19900;
export const TRIAL_DAYS = 3;

export const ENTERPRISE_PLANS: EnterprisePlan[] = [
  {
    key: "STARTER",
    name: "Enterprise Starter",
    priceCents: 49900,
    introPriceCents: INTRO_PRICE_CENTS,
    tagline: "For individual recruiters and small agencies.",
    entitlements: {
      jobsPerDay: 5,
      resumeCredits: 100,
      inmailCredits: 75,
      freePostBoosts: 0,
      freeCampaignBoosts: 0,
      atsScreening: true,
      candidateEngagement: true,
      resumeFetching: true,
      companyOutreach: true,
      paidBoosts: true,
      jobAnnouncements: true,
    },
  },
  {
    key: "PROFESSIONAL",
    name: "Enterprise Professional",
    priceCents: 99900,
    introPriceCents: INTRO_PRICE_CENTS,
    tagline: "For staffing firms and in-house talent teams.",
    entitlements: {
      jobsPerDay: 10,
      resumeCredits: 300,
      inmailCredits: 175,
      freePostBoosts: 1,
      freeCampaignBoosts: 1,
      atsScreening: true,
      candidateEngagement: true,
      resumeFetching: true,
      companyOutreach: true,
      paidBoosts: true,
      jobAnnouncements: true,
    },
  },
];

/** 3-day trial: try the job-posting workflow only. */
export const TRIAL_ENTITLEMENTS: EnterpriseEntitlements = {
  jobsPerDay: 1,
  resumeCredits: 0,
  inmailCredits: 0,
  freePostBoosts: 0,
  freeCampaignBoosts: 0,
  atsScreening: false,
  candidateEngagement: false,
  resumeFetching: false,
  companyOutreach: false,
  paidBoosts: false,
  jobAnnouncements: false,
};

export const FREE_ENTITLEMENTS: EnterpriseEntitlements = {
  ...TRIAL_ENTITLEMENTS,
  jobsPerDay: 0,
};

/** Pay-as-you-go prices, charged through PayPal before a boost is created. */
export const BOOST_PRICES_CENTS = { POST: 1900, CAMPAIGN: 4900 } as const;
export const BOOST_DAYS = { POST: 7, CAMPAIGN: 14 } as const;

export function getEnterprisePlan(key: EnterprisePlanKey): EnterprisePlan {
  const plan = ENTERPRISE_PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown enterprise plan ${key}`);
  return plan;
}

export function formatUsd(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
