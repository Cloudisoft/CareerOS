import type { Metadata } from "next";
import { requestCache } from "@/lib/request-cache";
import { prisma } from "@/lib/prisma";
import { BRAND, SITE_URL } from "@/config/brand";

/**
 * The job page itself renders in the browser; this server layout gives it a
 * real title and description and Google for Jobs structured data
 * (JobPosting), so each open role can be found in search.
 */
const loadJob = requestCache((id: string) =>
  prisma.job.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      workplaceType: true,
      employmentType: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      company: { select: { name: true, slug: true, website: true, logoUrl: true } },
    },
  })
);

const EMPLOYMENT: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  TEMPORARY: "TEMPORARY",
  INTERNSHIP: "INTERN",
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await loadJob(params.id).catch(() => null);
  if (!job) return { title: "Job not found", robots: { index: false } };
  const where = job.location ? ` in ${job.location}` : job.workplaceType === "REMOTE" ? " (remote)" : "";
  const title = `${job.title} at ${job.company.name}${where}`;
  const description = `${job.company.name} is hiring a ${job.title}${where}. ${plain(job.description).slice(0, 110)}… Apply on ${BRAND.fullName}.`;
  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical: `/jobs/${job.id}` },
    // Closed roles stay reachable but drop out of search.
    robots: job.status === "OPEN" ? undefined : { index: false, follow: true },
    openGraph: { type: "website", url: `/jobs/${job.id}`, title, description: description.slice(0, 200), images: job.company.logoUrl ? [{ url: job.company.logoUrl }] : undefined },
  };
}

export default async function JobLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const job = await loadJob(params.id).catch(() => null);
  const structured =
    job && job.status === "OPEN"
      ? {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: plain(job.description)
            .split(/(?<=[.!?])\s{1,}(?=[A-Z])/)
            .reduce<string[]>((paras, sentence, i) => (i % 4 === 0 ? [...paras, sentence] : [...paras.slice(0, -1), `${paras[paras.length - 1]} ${sentence}`]), [])
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join(""),
          datePosted: job.createdAt.toISOString(),
          ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
          employmentType: EMPLOYMENT[job.employmentType] ?? "FULL_TIME",
          identifier: { "@type": "PropertyValue", name: job.company.name, value: job.id },
          hiringOrganization: {
            "@type": "Organization",
            name: job.company.name,
            sameAs: job.company.website ?? `${SITE_URL}/company/${job.company.slug}`,
            ...(job.company.logoUrl ? { logo: job.company.logoUrl } : {}),
          },
          ...(job.location ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } } } : {}),
          ...(job.workplaceType === "REMOTE" ? { jobLocationType: "TELECOMMUTE" } : {}),
          ...(job.salaryMin || job.salaryMax
            ? {
                baseSalary: {
                  "@type": "MonetaryAmount",
                  currency: job.salaryCurrency,
                  value: { "@type": "QuantitativeValue", ...(job.salaryMin ? { minValue: job.salaryMin } : {}), ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: Math.max(job.salaryMin ?? 0, job.salaryMax ?? 0) < 1000 ? "HOUR" : "YEAR" },
                },
              }
            : {}),
          url: `${SITE_URL}/jobs/${job.id}`,
        }
      : null;
  return (
    <>
      {structured && (
        <script
          type="application/ld+json"
          // From our own database; JSON.stringify escapes it and "<" is escaped so it can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}
