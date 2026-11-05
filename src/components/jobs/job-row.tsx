import Link from "next/link";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { employmentLabel, payLabel, postedLabel, workplaceLabel } from "@/lib/jobs/display";
import { cn } from "@/lib/utils";

export interface JobRowData {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  createdAt: string | Date;
  matchScore?: number | null;
  promoted?: boolean;
  company: { name: string; logoUrl: string | null };
}

/** One job in a list: logo, company, title, pay · type, place · freshness. */
export function JobRowBody({ job, compact }: { job: JobRowData; compact?: boolean }) {
  const pay = payLabel(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const posted = postedLabel(job.createdAt);
  const place = job.workplaceType === "REMOTE" ? "Remote" : job.location ? `${job.location}${job.workplaceType === "HYBRID" ? " · Hybrid" : ""}` : workplaceLabel(job.workplaceType);
  return (
    <div className="flex min-w-0 gap-3.5">
      <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={compact ? 40 : 44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-muted-foreground">{job.company.name}</p>
        <p className="mt-0.5 line-clamp-2 font-semibold leading-snug text-foreground">{job.title}</p>
        <p className="mt-1 text-sm text-foreground/80">
          {[pay, employmentLabel(job.employmentType)].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {job.promoted && <span className="font-medium text-foreground/70">Promoted ·</span>}
          <span className="truncate">{place}</span>
          <span>·</span>
          <span className={cn(posted === "New" && "font-medium text-success")}>{posted}</span>
          {job.matchScore != null && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{job.matchScore}% match</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function JobRowLink({ job, href }: { job: JobRowData; href?: string }) {
  return (
    <Link
      href={href ?? `/jobs?job=${job.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-raised/40"
    >
      <JobRowBody job={job} />
    </Link>
  );
}
