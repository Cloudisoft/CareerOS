import "server-only";
import type { NormalizedExternalJob } from "./types";

interface JSearchResult {
  job_id: string;
  job_title: string;
  job_description: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_employment_type?: string; // "FULLTIME" | "PARTTIME" | "CONTRACTOR" | "INTERN"
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_apply_link: string;
}

interface JSearchResponse {
  data: JSearchResult[];
}

function mapEmploymentType(type?: string): NormalizedExternalJob["employmentType"] {
  switch (type) {
    case "PARTTIME":
      return "PART_TIME";
    case "CONTRACTOR":
      return "CONTRACT";
    case "INTERN":
      return "INTERNSHIP";
    default:
      return "FULL_TIME";
  }
}

function buildLocation(job: JSearchResult): string | null {
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export class JSearchNotConfiguredError extends Error {
  code = "JSEARCH_NOT_CONFIGURED";
}

/** https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch — RapidAPI-hosted. */
export async function fetchJSearchJobs(query: string, page = 1): Promise<NormalizedExternalJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) throw new JSearchNotConfiguredError("Set JSEARCH_API_KEY (a RapidAPI key subscribed to JSearch) to sync JSearch jobs.");

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("num_pages", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`JSearch request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as JSearchResponse;
  return (data.data ?? []).map((j) => ({
    source: "jsearch" as const,
    externalId: j.job_id,
    title: j.job_title,
    description: j.job_description,
    companyName: j.employer_name || "Unknown Company",
    location: buildLocation(j),
    workplaceType: j.job_is_remote ? "REMOTE" : "ONSITE",
    employmentType: mapEmploymentType(j.job_employment_type),
    salaryMin: j.job_min_salary ? Math.round(j.job_min_salary) : null,
    salaryMax: j.job_max_salary ? Math.round(j.job_max_salary) : null,
    salaryCurrency: j.job_salary_currency || "USD",
    externalUrl: j.job_apply_link,
  }));
}
