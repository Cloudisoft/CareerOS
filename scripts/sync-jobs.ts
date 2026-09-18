/**
 * Pulls a broad, multi-page batch of listings from every configured
 * external job source (Adzuna, JSearch) across a wide spread of job
 * categories, keeping the marketplace populated beyond whatever any single
 * candidate's resume has triggered on demand. Safe to re-run on a schedule:
 * jobs are upserted by (source, externalId).
 *
 *   npx tsx scripts/sync-jobs.ts
 */
import { prisma } from "../src/lib/prisma";
import { syncExternalJobs } from "../src/lib/jobs/external/sync";
import { DEFAULT_JOB_CATEGORIES } from "../src/lib/jobs/external/categories";

async function main() {
  const results = await syncExternalJobs(DEFAULT_JOB_CATEGORIES, { pagesPerQuery: 2 });

  let totalFetched = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  const errors: string[] = [];

  for (const r of results) {
    totalFetched += r.fetched;
    totalCreated += r.created;
    totalUpdated += r.updated;
    if (r.errors.length) errors.push(...r.errors.map((e) => `${r.query}: ${e}`));
  }

  console.log(
    `Synced ${results.length} categories — fetched ${totalFetched}, created ${totalCreated}, updated ${totalUpdated}.`
  );
  if (errors.length) {
    console.log(`${errors.length} error(s):`);
    for (const e of errors.slice(0, 20)) console.log(`  - ${e}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
