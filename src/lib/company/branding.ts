import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Fills in a company's logo (and banner) from its own website, so job cards
 * and company pages show the real brand instead of a letter tile.
 *
 * The website comes from the company profile (then nothing else is tried),
 * or from a careers page the company hosts itself, or, last, from a guess
 * based on the name. A guess is only used when the site stays on that
 * domain and its own title contains the full company name, so a look-alike
 * domain never puts the wrong logo on a company. Each company
 * is looked up once (brandCheckedAt); a company that already has a logo is
 * left alone.
 */

const ATS_HOSTS = [
  "greenhouse.io", "lever.co", "ashbyhq.com", "myworkdayjobs.com", "workday.com", "adzuna.com", "smartrecruiters.com", "icims.com",
  "jobvite.com", "bamboohr.com", "workable.com", "recruitee.com", "breezy.hr", "linkedin.com", "indeed.com", "glassdoor.com",
  "ziprecruiter.com", "jsearch", "rapidapi.com", "careeros", "silverspringstaffing.com", "taleo.net", "successfactors.com",
];
const SUFFIXES = /\b(inc|llc|ltd|limited|corp|corporation|co|company|plc|gmbh|group|holdings|technologies|technology|labs|the)\b\.?/g;
const UA = "Mozilla/5.0 (compatible; CareerOSBot/1.0; +https://careeros.silverspringstaffing.com)";
const inFlight = new Map<string, Promise<void>>();

function rootDomain(host: string) {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const twoPartTld = /^(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(parts.slice(-2).join("."));
  return parts.slice(twoPartTld ? -3 : -2).join(".");
}

function hostOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

function coreName(name: string) {
  return name.toLowerCase().replace(/&/g, " and ").replace(SUFFIXES, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Website domains worth trying, most trusted first. `trusted` ones need no title check. */
export function candidateDomains(name: string, website: string | null, jobUrls: string[]): { domain: string; trusted: boolean }[] {
  const out: { domain: string; trusted: boolean }[] = [];
  const add = (domain: string | null, trusted: boolean) => {
    if (domain && !out.some((d) => d.domain === domain) && !ATS_HOSTS.some((a) => domain.includes(a))) out.push({ domain, trusted });
  };
  const site = hostOf(website);
  // The company's own website is the answer; never guess past it.
  if (site) {
    add(rootDomain(site), true);
    return out;
  }
  for (const u of jobUrls) {
    const h = hostOf(u);
    if (h) add(rootDomain(h), false);
  }
  const core = coreName(name).replace(/ /g, "");
  if (core.length >= 4) for (const tld of [".com", ".ai", ".io", ".co"]) add(core + tld, false);
  return out.slice(0, 6);
}

/** The site's title (and og:site_name) must contain every word of the company name. */
export function titleMatches(name: string, title: string) {
  const words = coreName(name).split(" ").filter((w) => w.length >= 2);
  if (!words.length || words.join("").length < 4) return false;
  const t = ` ${title.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const squashed = t.replace(/ /g, "");
  return words.every((w) => t.includes(` ${w} `) || t.includes(` ${w}`)) || squashed.includes(words.join(""));
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null;
}

/** Reads the homepage: title, best icon and share image. Follows one meta-refresh redirect. */
async function readSite(domain: string) {
  const tried = new Set<string>();
  const queue = [`https://${domain}`, `https://www.${domain}`];
  while (queue.length) {
    const url = queue.shift()!;
    if (tried.has(url) || tried.size > 3) continue;
    tried.add(url);
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(6000) });
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) continue;
      const html = (await res.text()).slice(0, 400_000);
      const base = res.url;
      const abs = (href: string | null) => {
        if (!href) return null;
        try {
          const u = new URL(href.replace(/&amp;/g, "&"), base);
          return u.protocol === "https:" ? u.toString() : null;
        } catch {
          return null;
        }
      };
      const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
      const meta = (key: string) => {
        const m = metas.find((t) => new RegExp(`(property|name)\\s*=\\s*["']${key}["']`, "i").test(t));
        return m ? attr(m, "content") : null;
      };
      const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
      // Pages that only bounce you onward (<meta http-equiv="refresh" content="0;url=/us/en">).
      const refresh = metas.find((t) => /http-equiv\s*=\s*["']refresh["']/i.test(t));
      const next = refresh ? abs(attr(refresh, "content")?.split(/url=/i)[1]?.trim() ?? null) : null;
      if (!htmlTitle && next) {
        queue.unshift(next);
        continue;
      }
      const links = html.match(/<link\b[^>]*>/gi) ?? [];
      const touch = links.find((l) => /rel\s*=\s*["'][^"']*apple-touch-icon/i.test(l));
      const title = [htmlTitle, meta("og:site_name"), meta("og:title")].filter(Boolean).join(" | ");
      return { title, icon: abs(touch ? attr(touch, "href") : null), image: abs(meta("og:image") ?? meta("twitter:image")), finalHost: new URL(base).hostname };
    } catch {
      // try the next form of the address
    }
  }
  return null;
}

const WIKI_UA = { "user-agent": "CareerOSBot/1.0 (https://careeros.silverspringstaffing.com)" };
const COMPANYISH = /(company|corporation|business|firm|bank|retail|provider|manufacturer|developer|maker|startup|agency|organi[sz]ation|group|conglomerate|brand|platform|service|network|insur|chain|health|software|technolog|consult|staffing|media|publisher|airline|operator|holding|enterprise|studio|lab)/i;
const commonsFile = (file: string, width: number) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=${width}`;

/**
 * Wikidata (the open data behind Wikipedia): an entry whose name is exactly
 * the company's name, that describes a business and lists an official
 * website. Gives the website, often the logo, and a photo for the banner.
 */
async function fromWikidata(name: string) {
  try {
    const q = new URLSearchParams({ action: "wbsearchentities", search: name, language: "en", type: "item", limit: "5", format: "json" });
    const found = (await (await fetch(`https://www.wikidata.org/w/api.php?${q}`, { headers: WIKI_UA, signal: AbortSignal.timeout(6000) })).json()) as { search?: { id: string }[] };
    const ids = (found.search ?? []).map((r) => r.id).slice(0, 5);
    if (!ids.length) return null;
    const g = new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "labels|aliases|descriptions|claims", languages: "en", format: "json" });
    const data = (await (await fetch(`https://www.wikidata.org/w/api.php?${g}`, { headers: WIKI_UA, signal: AbortSignal.timeout(6000) })).json()) as {
      entities?: Record<string, { labels?: { en?: { value: string } }; aliases?: { en?: { value: string }[] }; descriptions?: { en?: { value: string } }; claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]> }>;
    };
    const want = coreName(name);
    for (const id of ids) {
      const e = data.entities?.[id];
      if (!e) continue;
      const names = [e.labels?.en?.value, ...(e.aliases?.en ?? []).map((a) => a.value)].filter(Boolean) as string[];
      if (!names.some((n) => coreName(n) === want)) continue;
      if (!COMPANYISH.test(e.descriptions?.en?.value ?? "")) continue;
      const claim = (p: string) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
      const website = claim("P856");
      const host = typeof website === "string" ? hostOf(website) : null;
      if (!host) continue;
      const logo = claim("P154");
      const image = claim("P18");
      return {
        domain: rootDomain(host),
        logo: typeof logo === "string" ? commonsFile(logo, 256) : null,
        cover: typeof image === "string" ? commonsFile(image, 1600) : null,
      };
    }
  } catch {
    // Wikidata unreachable: other sources still apply
  }
  return null;
}

/** Clearbit's public company search: only an exact name match counts. */
async function fromClearbit(name: string) {
  try {
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const list = (await res.json()) as { name: string; domain: string }[];
    const want = coreName(name);
    const hit = list.find((c) => coreName(c.name) === want && c.domain);
    return hit ? { domain: rootDomain(hit.domain) } : null;
  } catch {
    return null;
  }
}

/** Google's favicon for a domain, only when Google actually has one (it answers 404 otherwise). */
async function googleIcon(domain: string) {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

const RECHECK_MS = 14 * 24 * 60 * 60 * 1000;

async function enrich(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, website: true, logoUrl: true, coverUrl: true, brandCheckedAt: true, jobs: { select: { externalUrl: true }, where: { externalUrl: { not: null } }, take: 5 } },
  });
  if (!company || (company.logoUrl && company.coverUrl)) return;
  if (company.brandCheckedAt && Date.now() - company.brandCheckedAt.getTime() < RECHECK_MS) return;
  // Mark first, so a slow site is never looked up twice at once.
  await prisma.company.update({ where: { id: company.id }, data: { brandCheckedAt: new Date() } });

  // Sources, most trustworthy first. Trusted ones are known to be this company's own website.
  type Source = { domain: string; trusted: boolean; logo?: string | null; cover?: string | null };
  const sources: Source[] = [];
  const push = (s: Source) => {
    if (!sources.some((x) => x.domain === s.domain) && !ATS_HOSTS.some((a) => s.domain.includes(a))) sources.push(s);
  };
  const guesses = candidateDomains(company.name, company.website, company.jobs.map((j) => j.externalUrl!));
  if (company.website) {
    guesses.forEach(push);
  } else {
    const [wiki, clearbit] = await Promise.all([fromWikidata(company.name), fromClearbit(company.name)]);
    if (wiki) push({ domain: wiki.domain, trusted: true, logo: wiki.logo, cover: wiki.cover });
    if (clearbit) push({ domain: clearbit.domain, trusted: true });
    guesses.forEach(push);
  }

  let logoUrl = company.logoUrl;
  let coverUrl = company.coverUrl;
  let website = company.website;
  for (const src of sources) {
    const site = await readSite(src.domain);
    if (!src.trusted) {
      // A guess must stay on its own domain (no redirect to another company) and name the company in its title.
      if (!site || rootDomain(site.finalHost) !== src.domain || !titleMatches(company.name, site.title)) continue;
    }
    const root = site ? rootDomain(site.finalHost) : src.domain;
    logoUrl ||= src.logo ?? site?.icon ?? (await googleIcon(root));
    coverUrl ||= site?.image ?? src.cover ?? null;
    website ||= `https://${root}`;
    if (logoUrl) break;
  }
  if (logoUrl !== company.logoUrl || coverUrl !== company.coverUrl || website !== company.website) {
    await prisma.company.update({ where: { id: company.id }, data: { logoUrl, coverUrl, website } });
  }
}

const needsBrand = () => ({
  deletedAt: null,
  OR: [{ logoUrl: null }, { coverUrl: null }],
  AND: [{ OR: [{ brandCheckedAt: null }, { brandCheckedAt: { lt: new Date(Date.now() - RECHECK_MS) } }] }],
});

let lastSweep = 0;
/** Works through every company still missing a logo or banner, a few at a time, at most every few minutes. */
export function sweepCompanyBrands(batch = 8) {
  if (Date.now() - lastSweep < 5 * 60 * 1000) return;
  lastSweep = Date.now();
  void prisma.company
    .findMany({ where: needsBrand(), select: { id: true }, take: batch, orderBy: { createdAt: "desc" } })
    .then((rows) => enrichCompanyBrands(rows.map((r) => r.id)))
    .catch(() => {});
}

/** Looks up logos for these companies in the background (never blocks a page). */
export function enrichCompanyBrands(companyIds: string[]) {
  for (const id of Array.from(new Set(companyIds)).slice(0, 8)) {
    if (inFlight.has(id)) continue;
    const run = enrich(id)
      .catch((error) => console.warn("Company brand lookup failed", id, error instanceof Error ? error.message : error))
      .finally(() => inFlight.delete(id));
    inFlight.set(id, run);
  }
}

/** Waits for a batch (Admin "Find logos now"); returns what's still missing overall. */
export async function enrichCompanyBrandsNow(limit = 25) {
  const companies = await prisma.company.findMany({ where: needsBrand(), select: { id: true }, take: limit, orderBy: { createdAt: "desc" } });
  for (let i = 0; i < companies.length; i += 5) await Promise.all(companies.slice(i, i + 5).map((c) => enrich(c.id).catch(() => {})));
  return brandCoverage(companies.length);
}

export async function brandCoverage(checked = 0) {
  const [total, withLogo, withCover, pending] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: null, logoUrl: { not: null } } }),
    prisma.company.count({ where: { deletedAt: null, coverUrl: { not: null } } }),
    prisma.company.count({ where: needsBrand() }),
  ]);
  return { checked, total, withLogo, withCover, pending };
}
