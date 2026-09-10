import "server-only";
import type { NormalizedExternalJob } from "./types";

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string; // "full_time" | "part_time"
  contract_type?: string; // "permanent" | "contract"
  redirect_url: string;
}

interface AdzunaResponse {
  results: AdzunaResult[];
}

function mapEmploymentType(contractTime?: string, contractType?: string): NormalizedExternalJob["employmentType"] {
  if (contractType === "contract") return "CONTRACT";
  if (contractTime === "part_time") return "PART_TIME";
  return "FULL_TIME";
}

function mapWorkplaceType(location?: string): NormalizedExternalJob["workplaceType"] {
  if (location && /\bremote\b/i.test(location)) return "REMOTE";
  return "ONSITE";
}

export class AdzunaNotConfiguredError extends Error {
  code = "ADZUNA_NOT_CONFIGURED";
}

/**
 * https://developer.adzuna.com/docs/search — `country` is a 2-letter Adzuna
 * market code (e.g. "us", "gb"), not a general ISO country list.
 */
export async function fetchAdzunaJobs(query: string, country = "us", page = 1, resultsPerPage = 20): Promise<NormalizedExternalJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new AdzunaNotConfiguredError("Set ADZUNA_APP_ID and ADZUNA_APP_KEY to sync Adzuna jobs.");

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", query);
  url.searchParams.set("content-type", "application/json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Adzuna request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as AdzunaResponse;
  return data.results.map((r) => ({
    source: "adzuna" as const,
    externalId: r.id,
    title: r.title,
    description: r.description,
    companyName: r.company?.display_name || "Unknown Company",
    location: r.location?.display_name ?? null,
    workplaceType: mapWorkplaceType(r.location?.display_name),
    employmentType: mapEmploymentType(r.contract_time, r.contract_type),
    salaryMin: r.salary_min ? Math.round(r.salary_min) : null,
    salaryMax: r.salary_max ? Math.round(r.salary_max) : null,
    salaryCurrency: "USD",
    externalUrl: r.redirect_url,
  }));
}
