import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/config/brand";

// Built on request: at build time the database isn't reachable, so a prebuilt
// sitemap would list only the fixed pages and none of the jobs or companies.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/employers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/careers`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/silvercareers`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/download`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const listings = await prisma.careersListing.findMany({
      where: { published: true, deletedAt: null },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    pages.push(...listings.map((l) => ({ url: `${SITE_URL}/careers/${l.id}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })));
    // Every open job and every company with a public page.
    const [jobs, companies] = await Promise.all([
      prisma.job.findMany({ where: { status: "OPEN", deletedAt: null }, select: { id: true, updatedAt: true }, orderBy: { createdAt: "desc" }, take: 20000 }),
      prisma.company.findMany({ where: { deletedAt: null, jobs: { some: { status: "OPEN", deletedAt: null } } }, select: { slug: true, updatedAt: true }, take: 10000 }),
    ]);
    pages.push(...jobs.map((j) => ({ url: `${SITE_URL}/jobs/${j.id}`, lastModified: j.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })));
    pages.push(...companies.map((c) => ({ url: `${SITE_URL}/company/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })));
  } catch {
    // The static pages are still worth serving if the database is unreachable at build time.
  }
  return pages;
}
