/* eslint-disable @typescript-eslint/no-explicit-any -- board APIs return loosely shaped JSON; every field is read defensively where it is used. */
import "server-only";
import { prisma } from "@/lib/prisma";
import { BOARD_CATALOG } from "./catalog";
import { discoveryTitles, isRecent, locationFits, titleFit } from "./match";

/**
 * Automatic job discovery for Auto Apply: scan public employer boards (Greenhouse, Lever, Ashby: the forms
 * the extension fills end to end) for postings that fit the candidate's target titles and locations, so a
 * run always has jobs without anyone configuring sources. Board responses are cached for a few hours, so a
 * run costs at most one fetch per board, and a board that fails is skipped, never fatal.
 */

export type BoardKind = "greenhouse" | "lever" | "ashby";

export interface DiscoveredJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  workplaceType: "remote" | "hybrid" | "onsite" | null;
  url: string;
  applyUrl: string;
  ats: BoardKind;
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
  const boards = await pool([...BOARD_CATALOG], 12, (b) =>
    fetchBoard(b.kind, b.identifier, b.name).catch(() => {
      failed += 1;
      return [] as DiscoveredJob[];
    })
  );

  const scored = boards
    .flat()
    .filter((j) => j.title && isRecent(j.postedAt ? new Date(j.postedAt).toISOString() : null, RECENT_DAYS))
    .map((j) => ({ job: j, fit: titleFit(j.title, titles) }))
    .filter(({ job, fit }) => fit >= 0.6 && locationFits({ location: job.location, workplaceType: job.workplaceType }, prefs))
    .sort((a, b) => b.fit - a.fit || b.job.postedAt - a.job.postedAt);

  return {
    jobs: scored.slice(0, opts.limit ?? 100).map((s) => s.job),
    scanned: BOARD_CATALOG.length - failed,
    failed,
    reason: null as string | null,
  };
}
