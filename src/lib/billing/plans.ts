/**
 * Central plan + entitlement catalog. Every field here gates something real
 * in the product — see src/lib/billing/entitlements.ts's requireEntitlement
 * and the per-feature checks in each domain service for how each flag is
 * actually enforced, not just displayed as marketing copy.
 *
 * `Infinity` marks a genuinely unlimited numeric allotment (safe to use:
 * these values never touch a Prisma column directly — DB-backed limits like
 * AutoApplySettings.monthlyLimit are clamped against these at write time).
 */

export type PlanKey = "FREE" | "BASIC" | "STANDARD" | "PREMIUM" | "ELITE";
/** The plans that actually have a Stripe price — everything except Free. */
export type PayablePlanKey = Exclude<PlanKey, "FREE">;
export type AddOnKey = "RESUME_STUDIO" | "INTERVIEW_AI";
export type AiPriorityTier = "standard" | "priority" | "highest";

export interface Entitlements {
  // Auto Apply
  autoApply: boolean;
  monthlyApplicationLimit: number;
  /** A "campaign" is one distinct Auto Apply run the extension starts. */
  campaignMonthlyLimit: number;

  // Job GPT (AI Career Assistant)
  jobGpt: boolean;
  jobGptMonthlyMessageLimit: number;
  /** Full multi-conversation history vs. only the single most recent thread. */
  careerMemory: boolean;

  // Resume & cover letters
  resumeImportLimit: number;
  resumeOptimization: boolean;
  coverLetterStudio: boolean;
  /** "Resume Truth Engine" — real ATS keyword/structure score. */
  atsScanner: boolean;
  /** "Advanced Resume Truth" — full matched/missing keyword + recommendation detail. */
  atsScannerDetail: boolean;

  // Matching & analytics
  /** "Job Opportunity Score" / "Talent Fit Engine" — full match breakdown, not just a badge. */
  matchInsights: boolean;
  /** Full Career Readiness sub-score breakdown vs. just the overall number. */
  careerAnalytics: boolean;
  /** Salary-fit detail against real posted salary ranges. */
  salaryIntelligence: boolean;

  // Interview AI
  interviewAi: boolean;
  interviewSessionMonthlyLimit: number;
  /** Target a specific job/company when starting a session. */
  companyInterviewPrep: boolean;

  // Learning & network
  learning: boolean;
  networkFeatures: boolean;

  // Service tier
  aiPriorityTier: AiPriorityTier;
  /** Executive-toned AI output for resume/cover-letter/coaching. */
  executiveMode: boolean;
  prioritySupport: boolean;
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
    key: "FREE",
    name: "Free",
    priceMonthly: 0,
    bestFor: "Getting started with a real Career Profile and a taste of automation.",
    features: [
      "AI Career Profile",
      "Basic Dashboard",
      "Basic Job Search",
      "Save Jobs",
      "20 Auto Apply applications/month",
      "Basic AI Career Assistant",
      "1 Resume Import",
      "Basic Resume Health",
      "Community Support",
    ],
    entitlements: {
      autoApply: true,
      monthlyApplicationLimit: 20,
      campaignMonthlyLimit: 1,
      jobGpt: true,
      jobGptMonthlyMessageLimit: 20,
      careerMemory: false,
      resumeImportLimit: 1,
      resumeOptimization: false,
      coverLetterStudio: false,
      atsScanner: false,
      atsScannerDetail: false,
      matchInsights: false,
      careerAnalytics: false,
      salaryIntelligence: false,
      interviewAi: false,
      interviewSessionMonthlyLimit: 0,
      companyInterviewPrep: false,
      learning: false,
      networkFeatures: true,
      aiPriorityTier: "standard",
      executiveMode: false,
      prioritySupport: false,
    },
  },
  {
    key: "BASIC",
    name: "Basic",
    priceMonthly: 19,
    bestFor: "Active job seekers who want real automation and AI-backed matching.",
    features: [
      "100 Auto Apply applications/month",
      "Resume Truth Engine",
      "Job Opportunity Score",
      "Talent Fit Engine",
      "AI Career Assistant",
      "Cover Letter Studio",
      "Career Analytics",
      "3 AI Application Campaigns",
    ],
    entitlements: {
      autoApply: true,
      monthlyApplicationLimit: 100,
      campaignMonthlyLimit: 3,
      jobGpt: true,
      jobGptMonthlyMessageLimit: Infinity,
      careerMemory: true,
      resumeImportLimit: Infinity,
      resumeOptimization: false,
      coverLetterStudio: true,
      atsScanner: true,
      atsScannerDetail: false,
      matchInsights: true,
      careerAnalytics: true,
      salaryIntelligence: false,
      interviewAi: false,
      interviewSessionMonthlyLimit: 0,
      companyInterviewPrep: false,
      learning: false,
      networkFeatures: true,
      aiPriorityTier: "standard",
      executiveMode: false,
      prioritySupport: false,
    },
  },
  {
    key: "STANDARD",
    name: "Standard",
    priceMonthly: 49,
    bestFor: "Candidates who want deeper resume truth, interview prep, and priority AI.",
    features: [
      "200 Auto Apply applications/month",
      "Career Memory",
      "Advanced Resume Analytics",
      "Advanced Resume Truth",
      "Priority AI",
      "AI Interview Preparation",
      "10 AI Campaigns",
    ],
    entitlements: {
      autoApply: true,
      monthlyApplicationLimit: 200,
      campaignMonthlyLimit: 10,
      jobGpt: true,
      jobGptMonthlyMessageLimit: Infinity,
      careerMemory: true,
      resumeImportLimit: Infinity,
      resumeOptimization: false,
      coverLetterStudio: true,
      atsScanner: true,
      atsScannerDetail: true,
      matchInsights: true,
      careerAnalytics: true,
      salaryIntelligence: false,
      interviewAi: true,
      interviewSessionMonthlyLimit: 5,
      companyInterviewPrep: false,
      learning: true,
      networkFeatures: true,
      aiPriorityTier: "priority",
      executiveMode: false,
      prioritySupport: false,
    },
  },
  {
    key: "PREMIUM",
    name: "Premium",
    priceMonthly: 99,
    bestFor: "Candidates who want maximum reach and interview-ready confidence.",
    features: [
      "500 Auto Apply applications/month",
      "Unlimited Resume Optimization",
      "Interview Truth Engine",
      "Company Interview Preparation",
      "Salary Intelligence",
      "Unlimited AI Campaigns",
    ],
    entitlements: {
      autoApply: true,
      monthlyApplicationLimit: 500,
      campaignMonthlyLimit: Infinity,
      jobGpt: true,
      jobGptMonthlyMessageLimit: Infinity,
      careerMemory: true,
      resumeImportLimit: Infinity,
      resumeOptimization: true,
      coverLetterStudio: true,
      atsScanner: true,
      atsScannerDetail: true,
      matchInsights: true,
      careerAnalytics: true,
      salaryIntelligence: true,
      interviewAi: true,
      interviewSessionMonthlyLimit: 50,
      companyInterviewPrep: true,
      learning: true,
      networkFeatures: true,
      aiPriorityTier: "priority",
      executiveMode: false,
      prioritySupport: false,
    },
    recommended: true,
  },
  {
    key: "ELITE",
    name: "Elite",
    priceMonthly: 149,
    bestFor: "Executive and specialized searches that need the highest daily volume.",
    features: [
      "Unlimited Auto Apply",
      "Unlimited AI Campaigns",
      "Unlimited Interview AI",
      "Executive Resume Optimization",
      "Executive Cover Letters",
      "Executive Career Coaching",
      "Highest AI Priority",
      "VIP Support",
    ],
    entitlements: {
      autoApply: true,
      monthlyApplicationLimit: Infinity,
      campaignMonthlyLimit: Infinity,
      jobGpt: true,
      jobGptMonthlyMessageLimit: Infinity,
      careerMemory: true,
      resumeImportLimit: Infinity,
      resumeOptimization: true,
      coverLetterStudio: true,
      atsScanner: true,
      atsScannerDetail: true,
      matchInsights: true,
      careerAnalytics: true,
      salaryIntelligence: true,
      interviewAi: true,
      interviewSessionMonthlyLimit: Infinity,
      companyInterviewPrep: true,
      learning: true,
      networkFeatures: true,
      aiPriorityTier: "highest",
      executiveMode: true,
      prioritySupport: true,
    },
  },
];

export const ADD_ONS: { key: AddOnKey; name: string; price: number; period: "month" | "year"; description: string; features: string[] }[] = [
  {
    key: "RESUME_STUDIO",
    name: "Resume Studio",
    price: 2.99,
    period: "month",
    description: "Unlimited AI-assisted resume versions, templates, and exports — independent of your plan.",
    features: [
      "Unlimited Resume Builder",
      "Unlimited Resume Tailoring",
      "Resume Parser",
      "Resume Library",
      "Unlimited Resume Versions",
      "ATS Optimization",
      "Resume Truth Report",
      "Resume Analytics",
      "60+ Resume Templates",
      "30+ Cover Letter Templates",
      "Unlimited PDF & DOCX Export",
    ],
  },
  {
    key: "INTERVIEW_AI",
    name: "Interview AI",
    price: 199,
    period: "year",
    description: "Unlimited adaptive interview practice sessions with detailed scoring.",
    features: ["Unlimited Interview AI sessions", "Company Interview Preparation", "Interview Truth Engine"],
  },
];

export function getPlan(key: PlanKey) {
  const plan = PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown plan: ${key}`);
  return plan;
}
