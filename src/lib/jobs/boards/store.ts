import "server-only";
import { prisma } from "@/lib/prisma";
import { findOrCreateExternalCompany } from "@/lib/company/service";
import { externalJobExpiry } from "@/lib/jobs/lifecycle";
import { discoverJobsForUser, type DiscoveredJob } from "./discover";

/**
 * Employer-board postings (Greenhouse, Lever, Ashby, Workday) found for a candidate are kept in the Job table
 * next to the Adzuna/JSearch listings, so the Jobs page shows them too. Keyed on (source, externalId) like the
 * aggregator sync: a posting found again updates in place and its expiry resets, one that stops showing up
 * ages out on its own (see lifecycle.ts).
 */

const WORKPLACE = { remote: "REMOTE", hybrid: "HYBRID", onsite: "ONSITE" } as const;
const REFRESH_MS = 3 * 60 * 60 * 1000;

export async function saveDiscoveredJobs(jobs: DiscoveredJob[]): Promise<number> {
  const companies = new Map<string, Promise<{ id: string }>>();
  let saved = 0;
  for (const job of jobs) {
    try {
      const key = job.company.trim().toLowerCase();
      if (!companies.has(key)) companies.set(key, findOrCreateExternalCompany(job.company));
      const company = await companies.get(key)!;
      const data = {
        companyId: company.id,
        title: job.title.slice(0, 300),
        description: job.description || job.title,
        location: job.location || null,
        workplaceType: WORKPLACE[job.workplaceType ?? "onsite"],
        status: "OPEN" as const,
        expiresAt: externalJobExpiry(),
        externalUrl: job.url,
        externalId: job.externalId,
        source: job.ats,
      };
      await prisma.job.upsert({
        where: { source_externalId: { source: job.ats, externalId: job.externalId } },
        create: data,
        update: data,
      });
      saved += 1;
    } catch {
      // One bad row (a race on the same posting, an odd title) never stops the rest.
    }
  }
  return saved;
}

const lastRefresh = new Map<string, number>();
const inFlight = new Map<string, Promise<number>>();

/** Scan the boards for this candidate and store what fits, at most once every few hours per person. */
export function refreshBoardJobs(userId: string): Promise<number> {
  const running = inFlight.get(userId);
  if (running) return running;
  if (Date.now() - (lastRefresh.get(userId) ?? 0) < REFRESH_MS) return Promise.resolve(0);
  lastRefresh.set(userId, Date.now());
  const run = discoverJobsForUser(userId)
    .then((found) => saveDiscoveredJobs(found.jobs))
    .catch(() => {
      lastRefresh.delete(userId); // try again on the next visit
      return 0;
    })
    .finally(() => inFlight.delete(userId));
  inFlight.set(userId, run);
  return run;
}
