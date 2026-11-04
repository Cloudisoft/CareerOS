import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://careeros.silverspringstaffing.com").replace(/\/$/, "");

export const revalidate = 3600;

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
  } catch {
    // The static pages are still worth serving if the database is unreachable at build time.
  }
  return pages;
}
