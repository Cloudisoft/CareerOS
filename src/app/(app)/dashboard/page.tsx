import Link from "next/link";
import { Briefcase, FileText, TrendingUp } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCompanyForUser, getCompanyDashboardStats } from "@/lib/company/service";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileWithCounts = {
  onboardingCompletedAt: Date | null;
  _count: { skills: number; experiences: number; resumes: number };
} | null;

function getNextBestAction(profile: ProfileWithCounts): { message: string; href: string; cta: string } | null {
  if (!profile?.onboardingCompletedAt) return null;

  if (profile._count.skills < 5) {
    return {
      message: `You've added ${profile._count.skills} skill${profile._count.skills === 1 ? "" : "s"}. Adding more will sharpen your future job matches and raise your Skills score.`,
      href: "/profile",
      cta: "Add skills",
    };
  }
  if (profile._count.experiences === 0) {
    return {
      message: "Add your work experience so Career OS understands your background.",
      href: "/profile",
      cta: "Add experience",
    };
  }
  return {
    message: "Your Career Profile is in great shape. Job matching, resumes, and interview prep unlock as each part of Career OS ships.",
    href: "/profile",
    cta: "Review profile",
  };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  if (user.role !== "CANDIDATE") {
    const company = await getCompanyForUser(user.id);

    if (!company) {
      return (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>
              {greeting()}, {user.firstName}
            </CardTitle>
            <CardDescription>
              Create your company profile to start posting jobs and searching Career OS talent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/employer/company">Set up your company</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    const stats = await getCompanyDashboardStats(company.id);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting()}, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's how {company.name} is doing on Career OS.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.openJobs}</p>
                <p className="text-xs text-muted-foreground">Open jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.newApplicationsThisWeek}</p>
                <p className="text-xs text-muted-foreground">New this week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/employer/jobs/new">Post a job</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/employer/talent">Search talent</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { skills: true, experiences: true, resumes: true } } },
  });

  const nextBestAction = getNextBestAction(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting()}, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's where your Career Profile stands today.
        </p>
      </div>

      {!profile?.onboardingCompletedAt && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-foreground">Your Career Profile is incomplete</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish onboarding so Career OS can calculate your Career Readiness score and start
                matching you to jobs.
              </p>
            </div>
            <Button asChild>
              <Link href="/onboarding">Complete onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {nextBestAction && (
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Next best action</p>
              <p className="mt-1 text-sm text-foreground">{nextBestAction.message}</p>
            </div>
            <Button asChild variant="secondary">
              <Link href={nextBestAction.href}>{nextBestAction.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col items-center gap-8 p-8 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Career Readiness</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Calculated from your resume, profile completeness, skills, interview practice, and
              job match quality.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                ["Resume", profile?.resumeScore ?? 0],
                ["Profile", profile?.profileScore ?? 0],
                ["Skills", profile?.skillsScore ?? 0],
                ["Interview", profile?.interviewScore ?? 0],
                ["Job Match", profile?.jobMatchScore ?? 0],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold text-foreground">{val}</p>
                </div>
              ))}
            </div>
          </div>
          <CircularProgress value={profile?.careerReadinessScore ?? 0} size={140} label="Overall" />
        </CardContent>
      </Card>
    </div>
  );
}
