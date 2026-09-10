import "server-only";
import { prisma } from "@/lib/prisma";
import { findOrCreateExternalCompany } from "@/lib/company/service";
import { fetchAdzunaJobs } from "./adzuna";
import { fetchJSearchJobs } from "./jsearch";
import type { NormalizedExternalJob } from "./types";

export interface SyncResult {
  query: string;
  fetched: number;
  created: number;
  updated: number;
  errors: string[];
}

async function upsertExternalJob(job: NormalizedExternalJob): Promise<"created" | "updated"> {
  const company = await findOrCreateExternalCompany(job.companyName);

  const existing = await prisma.job.findUnique({
    where: { source_externalId: { source: job.source, externalId: job.externalId } },
  });

  const data = {
    companyId: company.id,
    title: job.title,
    description: job.description,
    location: job.location,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    status: "OPEN" as const,
    externalUrl: job.externalUrl,
    externalId: job.externalId,
    source: job.source,
  };

  if (existing) {
    await prisma.job.update({ where: { id: existing.id }, data });
    return "updated";
  }

  await prisma.job.create({ data });
  return "created";
}

/**
 * Pulls listings for each query from every configured external source
 * (Adzuna, JSearch — sources with no API key set are skipped, not errored)
 * and upserts them as real, browsable marketplace jobs. Safe to re-run: jobs
 * are keyed on (source, externalId), so a repeat sync updates in place
 * instead of duplicating.
 */
export async function syncExternalJobs(queries: string[], options?: { country?: string }): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const hasAdzuna = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  const hasJSearch = Boolean(process.env.JSEARCH_API_KEY);

  for (const query of queries) {
    const result: SyncResult = { query, fetched: 0, created: 0, updated: 0, errors: [] };

    const fetches: Promise<NormalizedExternalJob[]>[] = [];
    if (hasAdzuna) fetches.push(fetchAdzunaJobs(query, options?.country ?? "us"));
    if (hasJSearch) fetches.push(fetchJSearchJobs(query));

    const settled = await Promise.allSettled(fetches);
    const jobs: NormalizedExternalJob[] = [];
    for (const outcome of settled) {
      if (outcome.status === "fulfilled") jobs.push(...outcome.value);
      else result.errors.push(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason));
    }

    result.fetched = jobs.length;
    for (const job of jobs) {
      try {
        const outcome = await upsertExternalJob(job);
        if (outcome === "created") result.created += 1;
        else result.updated += 1;
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    results.push(result);
  }

  return results;
}
