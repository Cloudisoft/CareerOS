/**
 * One-off admin script: grants a specific user Elite + both add-ons for a
 * year, then runs a real external job sync. The account email and password
 * hash are read from environment variables set directly in Railway — never
 * committed to the repo, same as every other secret this app uses (PayPal
 * keys, AI provider keys, etc). The hash itself is a one-way bcrypt digest
 * (12 rounds, matching src/lib/auth/crypto.ts) computed offline; the
 * plaintext password was never written to any file. Self-contained (no
 * imports from files that guard with "server-only", since those throw
 * outside the Next.js server-component bundler and this runs as a plain
 * Node/tsx script).
 *
 * No-ops if the env vars aren't set, so it's safe to leave wired in.
 * Run once via the start command, then unset the env vars.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = process.env.ADMIN_GRANT_EMAIL;
const PASSWORD_HASH = process.env.ADMIN_GRANT_PASSWORD_HASH;

const EXTERNAL_JOB_LIFESPAN_DAYS = 14;
function externalJobExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + EXTERNAL_JOB_LIFESPAN_DAYS * 24 * 60 * 60 * 1000);
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "company"
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

async function findOrCreateExternalCompany(name: string) {
  const trimmed = name?.trim() || "Unknown Company";
  const existing = await prisma.company.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, members: { none: {} } },
  });
  if (existing) return existing;
  const slug = await uniqueSlug(trimmed);
  return prisma.company.create({ data: { slug, name: trimmed } });
}

type NormalizedJob = {
  source: "adzuna" | "jsearch";
  externalId: string;
  title: string;
  description: string;
  companyName: string;
  location: string | null;
  workplaceType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  externalUrl: string;
};

async function fetchAdzunaJobs(query: string, country = "us"): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("what", query);
  url.searchParams.set("content-type", "application/json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.log(`  [adzuna:${query}] ${response.status} ${(await response.text().catch(() => "")).slice(0, 200)}`);
    return [];
  }
  const data = (await response.json()) as { results: any[] };
  return data.results.map((r) => ({
    source: "adzuna" as const,
    externalId: r.id,
    title: r.title,
    description: r.description,
    companyName: r.company?.display_name || "Unknown Company",
    location: r.location?.display_name ?? null,
    workplaceType: (r.location?.display_name && /\bremote\b/i.test(r.location.display_name) ? "REMOTE" : "ONSITE") as NormalizedJob["workplaceType"],
    employmentType: (r.contract_type === "contract" ? "CONTRACT" : r.contract_time === "part_time" ? "PART_TIME" : "FULL_TIME") as NormalizedJob["employmentType"],
    salaryMin: r.salary_min ? Math.round(r.salary_min) : null,
    salaryMax: r.salary_max ? Math.round(r.salary_max) : null,
    salaryCurrency: "USD",
    externalUrl: r.redirect_url,
  }));
}

async function fetchJSearchJobs(query: string): Promise<NormalizedJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", "1");

  const response = await fetch(url.toString(), {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
  });
  if (!response.ok) {
    console.log(`  [jsearch:${query}] ${response.status} ${(await response.text().catch(() => "")).slice(0, 200)}`);
    return [];
  }
  const data = (await response.json()) as { data: any[] };
  return (data.data ?? []).map((j) => ({
    source: "jsearch" as const,
    externalId: j.job_id,
    title: j.job_title,
    description: j.job_description,
    companyName: j.employer_name || "Unknown Company",
    location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || null,
    workplaceType: (j.job_is_remote ? "REMOTE" : "ONSITE") as NormalizedJob["workplaceType"],
    employmentType: (j.job_employment_type === "PARTTIME" ? "PART_TIME" : j.job_employment_type === "CONTRACTOR" ? "CONTRACT" : j.job_employment_type === "INTERN" ? "INTERNSHIP" : "FULL_TIME") as NormalizedJob["employmentType"],
    salaryMin: j.job_min_salary ? Math.round(j.job_min_salary) : null,
    salaryMax: j.job_max_salary ? Math.round(j.job_max_salary) : null,
    salaryCurrency: j.job_salary_currency || "USD",
    externalUrl: j.job_apply_link,
  }));
}

async function upsertExternalJob(job: NormalizedJob) {
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
    expiresAt: externalJobExpiry(),
    externalUrl: job.externalUrl,
    externalId: job.externalId,
    source: job.source,
  };
  if (existing) {
    await prisma.job.update({ where: { id: existing.id }, data });
    return "updated" as const;
  }
  await prisma.job.create({ data });
  return "created" as const;
}

async function grantElite() {
  if (!EMAIL || !PASSWORD_HASH) throw new Error("ADMIN_GRANT_EMAIL/ADMIN_GRANT_PASSWORD_HASH not set");

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash: PASSWORD_HASH, status: "ACTIVE", emailVerified: new Date() },
    create: {
      email: EMAIL,
      passwordHash: PASSWORD_HASH,
      firstName: "Fakhruddin",
      lastName: "Snyder Staffing",
      role: "CANDIDATE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, onboardingCompletedAt: new Date() },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { plan: "ELITE", status: "ACTIVE", currentPeriodEnd: oneYearFromNow, cancelAtPeriodEnd: false },
    create: { userId: user.id, plan: "ELITE", status: "ACTIVE", currentPeriodEnd: oneYearFromNow },
  });

  for (const addOn of ["RESUME_STUDIO", "INTERVIEW_AI"] as const) {
    await prisma.addOnSubscription.upsert({
      where: { userId_addOn: { userId: user.id, addOn } },
      update: { status: "ACTIVE", currentPeriodEnd: oneYearFromNow, cancelAtPeriodEnd: false },
      create: { userId: user.id, addOn, status: "ACTIVE", currentPeriodEnd: oneYearFromNow },
    });
  }

  console.log(`Granted ELITE + Resume Studio + Interview AI to ${EMAIL} until ${oneYearFromNow.toISOString()}`);
}

async function syncJobs() {
  const queries = [
    "software engineer",
    "product manager",
    "data analyst",
    "registered nurse",
    "sales representative",
    "marketing manager",
    "project manager",
    "accountant",
    "customer service representative",
    "graphic designer",
  ];

  let created = 0;
  let updated = 0;
  let fetched = 0;

  for (const query of queries) {
    const [adzuna, jsearch] = await Promise.all([fetchAdzunaJobs(query), fetchJSearchJobs(query)]);
    const jobs = [...adzuna, ...jsearch];
    fetched += jobs.length;
    for (const job of jobs) {
      const result = await upsertExternalJob(job);
      if (result === "created") created += 1;
      else updated += 1;
    }
    console.log(`  [${query}] fetched ${jobs.length} (adzuna ${adzuna.length}, jsearch ${jsearch.length})`);
  }

  console.log(`External job sync done: ${fetched} fetched, ${created} created, ${updated} updated.`);
}

async function main() {
  if (!EMAIL || !PASSWORD_HASH) {
    console.log("ADMIN_GRANT_EMAIL/ADMIN_GRANT_PASSWORD_HASH not set — skipping admin grant.");
    return;
  }
  await grantElite();
  await syncJobs();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
