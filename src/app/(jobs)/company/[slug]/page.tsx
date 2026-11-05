"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, Globe, Link2, Briefcase, Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalaryRange } from "@/lib/utils";

interface CompanyJob {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  skills: string[];
}

interface CompanyDetail {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  website: string | null;
  linkedinUrl: string | null;
  isFollowing: boolean;
  jobs: CompanyJob[];
}

export default function CompanyPublicPage() {
  const params = useParams<{ slug: string }>();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/companies/${params.slug}`)
      .then((r) => r.json())
      .then((json) => setCompany(json.data?.company ?? null))
      .finally(() => setLoading(false));
  }, [params.slug]);

  async function toggleFollow() {
    if (!company) return;
    setFollowBusy(true);
    const nextFollowing = !company.isFollowing;
    setCompany({ ...company, isFollowing: nextFollowing });
    await fetch(`/api/companies/${params.slug}/follow`, { method: nextFollowing ? "POST" : "DELETE" });
    setFollowBusy(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          This company page could not be found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          {company.logoUrl && <AvatarImage src={company.logoUrl} />}
          <AvatarFallback className="text-lg">{company.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
            <Button size="sm" variant={company.isFollowing ? "outline" : "primary"} onClick={toggleFollow} disabled={followBusy}>
              {company.isFollowing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {company.isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {company.industry && <span>{company.industry}</span>}
            {company.size && <span>{company.size}</span>}
            {company.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {company.location}
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-3">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            {company.linkedinUrl && (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Link2 className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {company.description && (
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground">{company.description}</p>
      )}

      <h2 className="mt-10 mb-3 text-lg font-semibold text-foreground">
        Open roles ({company.jobs.length})
      </h2>

      {company.jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open roles right now.</p>
      ) : (
        <div className="space-y-3">
          {company.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <p className="font-medium text-foreground">{job.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {job.workplaceType}
                    </span>
                    <span>{formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                  </div>
                  {job.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
