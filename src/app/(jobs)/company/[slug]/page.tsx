import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Globe, Link2, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getCompanyPosts } from "@/lib/network/service";
import { enrichCompanyBrands } from "@/lib/company/branding";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { JobRowLink } from "@/components/jobs/job-row";
import { FollowButton } from "@/components/company/follow-button";
import { PostCard, type FeedPost } from "@/components/network/post-card";
import { cn } from "@/lib/utils";

async function loadCompany(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { _count: { select: { followers: true, jobs: { where: { status: "OPEN", deletedAt: null } } } } },
  });
  return company && !company.deletedAt ? company : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const company = await loadCompany(params.slug);
  if (!company) return { title: "Company not found" };
  return {
    title: `${company.name} — jobs and company profile`,
    description: company.description?.slice(0, 160) ?? `Open roles at ${company.name} on Career OS.`,
    alternates: { canonical: `/company/${company.slug}` },
  };
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "jobs", label: "Jobs" },
  { key: "posts", label: "Posts" },
] as const;

export default async function CompanyPage({ params, searchParams }: { params: { slug: string }; searchParams: { tab?: string } }) {
  const company = await loadCompany(params.slug);
  if (!company) notFound();
  const tab = TABS.some((t) => t.key === searchParams.tab) ? (searchParams.tab as (typeof TABS)[number]["key"]) : "overview";

  if (!company.logoUrl || !company.coverUrl) enrichCompanyBrands([company.id]);
  const user = await getSessionUser();
  const [following, jobs, posts] = await Promise.all([
    user ? prisma.companyFollower.findUnique({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, select: { id: true } }) : null,
    prisma.job.findMany({
      where: { companyId: company.id, status: "OPEN", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: tab === "jobs" ? 100 : 4,
      select: {
        id: true,
        title: true,
        location: true,
        workplaceType: true,
        employmentType: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        createdAt: true,
      },
    }),
    getCompanyPosts(company.id, tab === "posts" ? 20 : 2),
  ]);
  const shapedPosts = JSON.parse(JSON.stringify(posts.posts)) as FeedPost[];
  const counts = { jobs: company._count.jobs, posts: posts.total };
  const website = company.website ? (/^https?:\/\//.test(company.website) ? company.website : `https://${company.website}`) : null;
  const jobRows = jobs.map((j) => ({ ...j, company: { name: company.name, logoUrl: company.logoUrl } }));

  return (
    <div style={{ margin: "calc(var(--shell-pad, 0px) * -1)", marginBottom: 0 }}>
      {/* Banner */}
      <div className="relative h-40 overflow-hidden sm:h-56">
        {company.coverUrl ? (
          // Shown whole over a blurred fill of itself, so share images of any shape (often a wordmark) look intentional.
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={company.coverUrl} alt="" aria-hidden referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={company.coverUrl} alt={`${company.name}`} referrerPolicy="no-referrer" className="relative mx-auto h-full w-auto max-w-full object-contain pb-[72px] pt-4 sm:pb-[92px]" />
          </>
        ) : company.logoUrl ? (
          // No banner image: a soft wash of the company's own logo colours.
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={company.logoUrl} alt="" aria-hidden referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full scale-150 object-cover opacity-60 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 dark:from-black/30" />
          </>
        ) : (
          <div className="h-full w-full bg-brand-gradient">
            <div
              aria-hidden
              className="h-full w-full opacity-25"
              style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 35%), radial-gradient(circle at 85% 80%, white 0, transparent 30%)" }}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Identity card overlapping the banner */}
        <div className="relative -mt-16 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:-mt-20 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={80} className="rounded-xl text-2xl" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{company.name}</h1>
                {company.industry && <p className="mt-0.5 text-muted-foreground">{company.industry}</p>}
              </div>
            </div>
            <FollowButton slug={company.slug} initialFollowing={Boolean(following)} initialCount={company._count.followers} canFollow={user?.role === "CANDIDATE"} />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
            {company.location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {company.location}
              </span>
            )}
            {company.size && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> {company.size}
                {/employee/i.test(company.size) ? "" : " employees"}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {counts.jobs} open {counts.jobs === 1 ? "role" : "roles"}
            </span>
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-primary hover:underline">
                <Globe className="h-4 w-4" /> Visit website
              </a>
            )}
            {company.linkedinUrl && (
              <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-primary hover:underline">
                <Link2 className="h-4 w-4" /> LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-8 flex gap-7 border-b border-border" aria-label={`${company.name} sections`}>
          {TABS.map((t) => {
            const count = t.key === "jobs" ? counts.jobs : t.key === "posts" ? counts.posts : null;
            return (
              <Link
                key={t.key}
                href={t.key === "overview" ? `/company/${company.slug}` : `/company/${company.slug}?tab=${t.key}`}
                scroll={false}
                aria-current={tab === t.key ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 border-b-2 pb-3 text-[15px] font-semibold",
                  tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {count != null && <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-semibold text-muted-foreground">{count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                {company.description ? (
                  <p className="whitespace-pre-line leading-relaxed text-foreground/90">{company.description}</p>
                ) : (
                  <p className="text-muted-foreground">{company.name} hasn&apos;t added an overview yet.</p>
                )}
                {shapedPosts.length > 0 && (
                  <>
                    <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Latest from {company.name}</h2>
                    <div className="space-y-4">
                      {shapedPosts.map((p) => (
                        <PostCard key={p.id} post={p} currentUserId={user?.id ?? null} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <aside>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Open roles</h2>
                  {counts.jobs > jobRows.length && (
                    <Link href={`/company/${company.slug}?tab=jobs`} scroll={false} className="text-sm font-medium text-primary hover:underline">
                      See all {counts.jobs}
                    </Link>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  {jobRows.length ? jobRows.map((j) => <JobRowLink key={j.id} job={j} />) : <p className="text-sm text-muted-foreground">No open roles right now.</p>}
                </div>
              </aside>
            </div>
          )}

          {tab === "jobs" &&
            (jobRows.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {jobRows.map((j) => (
                  <JobRowLink key={j.id} job={j} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-muted-foreground">No open roles right now. Follow {company.name} to hear when they post.</p>
            ))}

          {tab === "posts" &&
            (shapedPosts.length ? (
              <div className="mx-auto max-w-2xl space-y-4">
                {shapedPosts.map((p) => (
                  <PostCard key={p.id} post={p} currentUserId={user?.id ?? null} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-muted-foreground">No posts yet.</p>
            ))}
        </div>
      </div>
    </div>
  );
}
