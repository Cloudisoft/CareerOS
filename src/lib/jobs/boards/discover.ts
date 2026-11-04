/* eslint-disable @typescript-eslint/no-explicit-any -- board APIs return loosely shaped JSON; every field is read defensively where it is used. */
import "server-only";
import { prisma } from "@/lib/prisma";
import { BOARD_CATALOG, WORKDAY_CATALOG } from "./catalog";
import { discoveryTitles, isRecent, locationFits, titleFit } from "./match";

/**
 * Automatic job discovery for Auto Apply: scan public employer boards (Greenhouse, Lever, Ashby, Workday: the
 * forms the extension fills) for postings that fit the candidate's target titles and locations, so a
 * run always has jobs without anyone configuring sources. Board responses are cached for a few hours, so a
 * run costs at most one fetch per board, and a board that fails is skipped, never fatal.
 */

export type BoardKind = "greenhouse" | "lever" | "ashby";
export type DiscoveredAts = BoardKind | "workday";

export interface DiscoveredJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  workplaceType: "remote" | "hybrid" | "onsite" | null;
  url: string;
  applyUrl: string;
  ats: DiscoveredAts;
  description: string;
  postedAt: number;
}

const HOSTS: Record<BoardKind, string> = {
  greenhouse: "boards-api.greenhouse.io",
  lever: "api.lever.co",
  ashby: "api.ashbyhq.com",
};
const SLUG = /^[a-z0-9][a-z0-9-_.]{0,80}$/i;
const CACHE_MS = 3 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;
const RECENT_DAYS = 21;

const cache = new Map<string, { at: number; jobs: DiscoveredJob[] }>();

function htmlToText(html: unknown): string {
  return String(html ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function workplace(location: string, isRemote?: unknown, kind?: unknown): DiscoveredJob["workplaceType"] {
  const k = String(kind ?? "").toLowerCase();
  if (isRemote === true || k === "remote" || /\bremote\b|anywhere|work from home/i.test(location)) return "remote";
  if (k === "hybrid" || /\bhybrid\b/i.test(location)) return "hybrid";
  if (k === "onsite" || k === "on-site") return "onsite";
  return null;
}

function time(value: unknown): number {
  const t = typeof value === "number" ? value : Date.parse(String(value ?? ""));
  return Number.isFinite(t) ? t : 0;
}

/** Fetch JSON from a board API: fixed hosts only, no redirects, bounded time. */
async function getJson(kind: BoardKind, path: string): Promise<{ status: number; json: unknown }> {
  const url = new URL(`https://${HOSTS[kind]}${path}`);
  if (url.hostname !== HOSTS[kind]) throw new Error("Unexpected host");
  const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { accept: "application/json" } });
  return { status: res.status, json: res.ok ? await res.json() : null };
}

export async function fetchBoard(kind: BoardKind, identifier: string, company: string): Promise<DiscoveredJob[]> {
  if (!SLUG.test(identifier)) throw new Error("Invalid board identifier");
  const key = `${kind}:${identifier.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.jobs;

  let jobs: DiscoveredJob[] = [];
  if (kind === "greenhouse") {
    const { status, json } = await getJson(kind, `/v1/boards/${encodeURIComponent(identifier)}/jobs?content=true`);
    if (status !== 200) throw new Error(`Greenhouse board "${identifier}" returned ${status}`);
    jobs = (((json as { jobs?: unknown[] })?.jobs ?? []) as Array<Record<string, any>>)
      .filter((j) => j.absolute_url)
      .map((j) => {
        const location = j.location?.name ?? "";
        const hosted = /(^|\.)greenhouse\.io$/.test(new URL(j.absolute_url).hostname);
        return {
          externalId: `greenhouse:${j.id}`,
          title: j.title ?? "",
          company,
          location,
          workplaceType: workplace(location),
          url: j.absolute_url,
          // Postings on a company's own site load the form in a frame the extension can't reach;
          // Greenhouse's standalone form for the same posting always works.
          applyUrl: hosted ? j.absolute_url : `https://job-boards.greenhouse.io/embed/job_app?for=${encodeURIComponent(identifier)}&token=${encodeURIComponent(String(j.id))}`,
          ats: kind,
          description: htmlToText(j.content).slice(0, 6000),
          postedAt: time(j.first_published ?? j.updated_at),
        };
      });
  } else if (kind === "lever") {
    const { status, json } = await getJson(kind, `/v0/postings/${encodeURIComponent(identifier)}?mode=json`);
    if (status !== 200 || !Array.isArray(json)) throw new Error(`Lever board "${identifier}" returned ${status}`);
    jobs = (json as Array<Record<string, any>>).map((j) => {
      const cats = j.categories ?? {};
      const location = [cats.location, ...(Array.isArray(cats.allLocations) ? cats.allLocations : [])].filter((x, i, a) => x && a.indexOf(x) === i).join("; ");
      return {
        externalId: `lever:${j.id}`,
        title: j.text ?? "",
        company,
        location,
        workplaceType: workplace(location, null, j.workplaceType),
        url: j.hostedUrl,
        applyUrl: j.applyUrl || `${j.hostedUrl}/apply`,
        ats: kind,
        description: String(j.descriptionPlain ?? htmlToText(j.description)).slice(0, 6000),
        postedAt: time(j.createdAt),
      };
    });
  } else {
    const { status, json } = await getJson(kind, `/posting-api/job-board/${encodeURIComponent(identifier)}`);
    if (status !== 200) throw new Error(`Ashby board "${identifier}" returned ${status}`);
    jobs = (((json as { jobs?: unknown[] })?.jobs ?? []) as Array<Record<string, any>>)
      .filter((j) => j.jobUrl && j.isListed !== false)
      .map((j) => {
        const location = [j.location, ...(Array.isArray(j.secondaryLocations) ? j.secondaryLocations.map((s: any) => s.location) : [])].filter(Boolean).join("; ");
        return {
          externalId: `ashby:${j.id}`,
          title: j.title ?? "",
          company,
          location,
          workplaceType: workplace(location, j.isRemote, j.workplaceType),
          url: j.jobUrl,
          applyUrl: j.applyUrl || `${j.jobUrl}/application`,
          ats: kind,
          description: String(j.descriptionPlain ?? htmlToText(j.descriptionHtml)).slice(0, 6000),
          postedAt: time(j.publishedAt),
        };
      });
  }
  cache.set(key, { at: Date.now(), jobs });
  return jobs;
}

/* ---------------- Workday ---------------- */

type WorkdaySite = (typeof WORKDAY_CATALOG)[number];
const WORKDAY_PART = /^[A-Za-z0-9_-]{1,80}$/;
const WORKDAY_SEARCH_LIMIT = 20;
const WORKDAY_DETAILS_MAX = 40;
const workdayCache = new Map<string, { at: number; value: unknown }>();

function workdayBase(site: WorkdaySite): string {
  if (!WORKDAY_PART.test(site.tenant) || !/^wd\d{1,3}$/.test(site.pod) || !WORKDAY_PART.test(site.site)) throw new Error("Invalid Workday site");
  return `https://${site.tenant}.${site.pod}.myworkdayjobs.com`;
}

/** The career site's own search API: fixed host, no redirects, bounded time, cached like the boards. */
async function workdayJson(site: WorkdaySite, path: string, body?: unknown): Promise<any> {
  const url = new URL(`${workdayBase(site)}/wday/cxs/${site.tenant}/${site.site}${path}`);
  if (!url.hostname.endsWith(".myworkdayjobs.com")) throw new Error("Unexpected host");
  const key = `${url.href}|${body ? JSON.stringify(body) : ""}`;
  const hit = workdayCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Workday site "${site.tenant}" returned ${res.status}`);
  const value = await res.json();
  workdayCache.set(key, { at: Date.now(), value });
  return value;
}

/** "Posted Today", "Posted Yesterday", "Posted 3 Days Ago", "Posted 30+ Days Ago". */
export function workdayPostedAt(postedOn: unknown, now = Date.now()): number {
  const text = String(postedOn ?? "").toLowerCase();
  const day = 24 * 60 * 60 * 1000;
  if (/today|just now|hour/.test(text)) return now;
  if (/yesterday/.test(text)) return now - day;
  const n = text.match(/(\d+)\s*(\+)?\s*days?/);
  if (!n) return 0;
  return n[2] ? 0 : now - Number(n[1]) * day; // "30+ days": too old to say, treated as stale
}

/** Postings on one Workday site matching a title, with location and description from each posting. */
async function searchWorkday(site: WorkdaySite, title: string): Promise<Array<DiscoveredJob & { detailPath: string }>> {
  const json = await workdayJson(site, "/jobs", { appliedFacets: {}, limit: WORKDAY_SEARCH_LIMIT, offset: 0, searchText: title });
  const base = workdayBase(site);
  return ((json?.jobPostings ?? []) as Array<Record<string, any>>)
    .filter((j) => j.title && typeof j.externalPath === "string" && j.externalPath.startsWith("/job/"))
    .map((j) => {
      const url = `${base}/${site.site}${j.externalPath}`;
      return {
        externalId: `workday:${site.tenant}:${String(j.bulletFields?.[0] ?? j.externalPath).slice(0, 120)}`,
        title: j.title,
        company: site.name,
        location: /^\d+ locations?$/i.test(j.locationsText ?? "") ? "" : String(j.locationsText ?? ""),
        workplaceType: workplace(String(j.locationsText ?? "")),
        url,
        applyUrl: `${url}/apply/applyManually`,
        ats: "workday" as const,
        description: "",
        postedAt: workdayPostedAt(j.postedOn),
        detailPath: j.externalPath,
      };
    });
}

async function withWorkdayDetails(site: WorkdaySite, job: DiscoveredJob & { detailPath: string }): Promise<DiscoveredJob> {
  const { detailPath, ...rest } = job;
  try {
    const info = (await workdayJson(site, detailPath))?.jobPostingInfo ?? {};
    const location = [info.location, ...(Array.isArray(info.additionalLocations) ? info.additionalLocations : [])].filter(Boolean).join("; ");
    return {
      ...rest,
      location: location || rest.location,
      workplaceType: workplace(location || rest.location, null, info.remoteType) ?? rest.workplaceType,
      description: htmlToText(info.jobDescription).slice(0, 6000),
      url: typeof info.externalUrl === "string" && info.externalUrl.startsWith(`${workdayBase(site)}/`) ? info.externalUrl : rest.url,
    };
  } catch {
    return rest;
  }
}

/** Workday postings fitting the candidate's titles across the catalog, best title matches first. */
async function discoverWorkday(titles: string[], onFail: (tenant: string) => void): Promise<Array<{ job: DiscoveredJob; fit: number }>> {
  const searches = WORKDAY_CATALOG.flatMap((site) => titles.slice(0, 2).map((title) => ({ site, title })));
  const found = await pool(searches, 8, ({ site, title }) =>
    searchWorkday(site, title)
      .then((jobs) => jobs.map((job) => ({ site, job })))
      .catch(() => {
        onFail(site.tenant);
        return [];
      })
  );
  const seen = new Set<string>();
  const fitting = found
    .flat()
    .filter(({ job }) => job.postedAt && isRecent(new Date(job.postedAt).toISOString(), RECENT_DAYS))
    .map((x) => ({ ...x, fit: titleFit(x.job.title, titles) }))
    .filter((x) => x.fit >= 0.6 && !seen.has(x.job.externalId) && seen.add(x.job.externalId))
    .sort((a, b) => b.fit - a.fit || b.job.postedAt - a.job.postedAt)
    .slice(0, WORKDAY_DETAILS_MAX);
  return pool(fitting, 8, async ({ site, job, fit }) => ({ job: await withWorkdayDetails(site, job), fit }));
}

/** Run `fn` over `items` with at most `limit` in flight. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        out.push(await fn(item));
      }
    })
  );
  return out;
}

/** Fresh postings from the catalog that fit this candidate, best title matches first. */
export async function discoverJobsForUser(userId: string, opts: { limit?: number } = {}) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { desiredTitles: true, currentTitle: true, headline: true, desiredLocations: true, workplaceTypes: true, location: true },
  });
  if (!profile) return { jobs: [] as DiscoveredJob[], scanned: 0, failed: 0, reason: "Finish your Career Profile first." };
  const titles = discoveryTitles(profile);
  if (!titles.length) return { jobs: [] as DiscoveredJob[], scanned: 0, failed: 0, reason: "Add the job titles you want in your Career Profile." };

  const parts = (profile.location ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  const prefs = {
    workplaceTypes: profile.workplaceTypes.map((w) => w.toLowerCase()),
    desiredLocations: profile.desiredLocations,
    city: parts[0] ?? null,
    country: parts.length > 1 ? parts[parts.length - 1] : null,
  };

  let failed = 0;
  const workdayFailed = new Set<string>();
  const [boards, workday] = await Promise.all([
    pool([...BOARD_CATALOG], 12, (b) =>
      fetchBoard(b.kind, b.identifier, b.name).catch(() => {
        failed += 1;
        return [] as DiscoveredJob[];
      })
    ),
    discoverWorkday(titles, (tenant) => workdayFailed.add(tenant)),
  ]);

  const fits = ({ job }: { job: DiscoveredJob }) => locationFits({ location: job.location, workplaceType: job.workplaceType }, prefs);
  const fromBoards = boards
    .flat()
    .filter((j) => j.title && isRecent(j.postedAt ? new Date(j.postedAt).toISOString() : null, RECENT_DAYS))
    .map((j) => ({ job: j, fit: titleFit(j.title, titles) }))
    .filter((x) => x.fit >= 0.6 && fits(x));
  // A Workday posting with no readable location (only "3 Locations") is kept: the title already matched.
  const fromWorkday = workday.filter((x) => !x.job.location || fits(x));
  const scored = [...fromBoards, ...fromWorkday].sort((a, b) => b.fit - a.fit || b.job.postedAt - a.job.postedAt);

  failed += workdayFailed.size;
  return {
    jobs: scored.slice(0, opts.limit ?? 100).map((s) => s.job),
    scanned: BOARD_CATALOG.length + WORKDAY_CATALOG.length - failed,
    failed,
    reason: null as string | null,
  };
}
