import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {greeting()}, {user.firstName}
          </CardTitle>
          <CardDescription>
            The employer workspace is coming in a later phase of the Career OS build.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });

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
