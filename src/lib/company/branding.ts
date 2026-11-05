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

/** Reads the homepage: title, best icon and share image. */
async function readSite(domain: string) {
  for (const url of [`https://${domain}`, `https://www.${domain}`]) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(6000) });
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) continue;
      const html = (await res.text()).slice(0, 400_000);
      const base = res.url;
      const abs = (href: string | null) => {
        if (!href) return null;
        try {
          const u = new URL(href, base);
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
      const links = html.match(/<link\b[^>]*>/gi) ?? [];
      const touch = links.find((l) => /rel\s*=\s*["'][^"']*apple-touch-icon/i.test(l));
      const title = [html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1], meta("og:site_name"), meta("og:title")].filter(Boolean).join(" | ");
      return { title, icon: abs(touch ? attr(touch, "href") : null), image: abs(meta("og:image")), finalHost: new URL(base).hostname };
    } catch {
      // try the next form of the address
    }
  }
  return null;
}

async function enrich(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, website: true, logoUrl: true, coverUrl: true, brandCheckedAt: true, jobs: { select: { externalUrl: true }, where: { externalUrl: { not: null } }, take: 5 } },
  });
  if (!company || company.logoUrl || company.brandCheckedAt) return;
  // Mark first, so a slow site is never looked up twice at once.
  await prisma.company.update({ where: { id: company.id }, data: { brandCheckedAt: new Date() } });

  for (const { domain, trusted } of candidateDomains(company.name, company.website, company.jobs.map((j) => j.externalUrl!))) {
    const site = await readSite(domain);
    if (!site) continue;
    const root = rootDomain(site.finalHost);
    // A guess must stay on its own domain (no redirect to another company) and name the company in its title.
    if (!trusted && (root !== domain || !titleMatches(company.name, site.title))) continue;
    const logoUrl = site.icon ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(root)}&sz=128`;
    await prisma.company.update({
      where: { id: company.id },
      data: {
        logoUrl,
        ...(company.coverUrl || !site.image ? {} : { coverUrl: site.image }),
        ...(company.website ? {} : { website: `https://${root}` }),
      },
    });
    return;
  }
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

/** Waits for a batch (admin "find logos now"). */
export async function enrichCompanyBrandsNow(limit = 25) {
  const companies = await prisma.company.findMany({ where: { logoUrl: null, brandCheckedAt: null, deletedAt: null }, select: { id: true }, take: limit, orderBy: { createdAt: "desc" } });
  for (const c of companies) await enrich(c.id).catch(() => {});
  const found = await prisma.company.count({ where: { id: { in: companies.map((c) => c.id) }, logoUrl: { not: null } } });
  return { checked: companies.length, found };
}
