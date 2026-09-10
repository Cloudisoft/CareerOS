import "server-only";
import type { AiPriorityTier } from "@/lib/billing/plans";

/**
 * Real, enforced AI rate-limit tiers — "Priority AI" / "Highest AI Priority"
 * aren't just marketing copy, they're a genuinely higher per-minute ceiling
 * on AI-backed endpoints (Job GPT, Interview AI, resume/cover-letter
 * generation), applied via the same rate limiter every other endpoint uses.
 */
const LIMITS: Record<AiPriorityTier, { limit: number; windowMs: number }> = {
  standard: { limit: 15, windowMs: 60 * 1000 },
  priority: { limit: 40, windowMs: 60 * 1000 },
  highest: { limit: 100, windowMs: 60 * 1000 },
};

export function rateLimitForTier(tier: AiPriorityTier) {
  return LIMITS[tier];
}
