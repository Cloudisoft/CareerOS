import "server-only";
import { prisma } from "@/lib/prisma";

export const EMPLOYER_JOB_LIFESPAN_DAYS = 60;
export const EXTERNAL_JOB_LIFESPAN_DAYS = 14;

export function employerJobExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + EMPLOYER_JOB_LIFESPAN_DAYS * 24 * 60 * 60 * 1000);
}

export function externalJobExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + EXTERNAL_JOB_LIFESPAN_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Real, cron-free "this job is filled or no longer available" handling: an
 * employer posting quietly ages out after EMPLOYER_JOB_LIFESPAN_DAYS unless
 * re-saved (which resets expiresAt), and an externally-aggregated listing
 * ages out after EXTERNAL_JOB_LIFESPAN_DAYS unless a fresh sync re-confirms
 * it's still up (which also resets expiresAt). Cheap, indexed, idempotent —
 * safe to call on every jobs read rather than needing a scheduler.
 */
export async function closeExpiredJobs(): Promise<number> {
  const result = await prisma.job.updateMany({
    where: { status: "OPEN", expiresAt: { lt: new Date() } },
    data: { status: "CLOSED" },
  });
  return result.count;
}
