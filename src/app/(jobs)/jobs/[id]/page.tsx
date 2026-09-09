"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Loader2, CheckCircle2, MapPin, Briefcase, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircularProgress } from "@/components/ui/circular-progress";
import { formatSalaryRange } from "@/lib/utils";

interface ResumeOption {
  id: string;
  name: string;
  isPrimary: boolean;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  careerLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  company: { name: string; slug: string; industry: string | null; location: string | null };
  skills: { name: string; required: boolean }[];
}

interface MatchInfo {
  score: number;
  skillsScore: number;
  titleScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  gaps: string[];
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumeId, setResumeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [jobRes, meRes] = await Promise.all([fetch(`/api/jobs/${params.id}`), fetch("/api/auth/me")]);
      const json = await jobRes.json();
      const isAuthed = meRes.ok;
      setAuthed(isAuthed);
      if (jobRes.ok) {
        setJob(json.data.job);
        setMatch(json.data.match);
        setSaved(json.data.saved);
        setAlreadyApplied(json.data.alreadyApplied);
      }
      if (isAuthed) {
        const resumeRes = await fetch("/api/resumes");
        const resumeJson = await resumeRes.json();
        const list: ResumeOption[] = resumeJson.data?.resumes ?? [];
        setResumes(list);
        const primary = list.find((r) => r.isPrimary) ?? list[0];
        if (primary) setResumeId(primary.id);
      }
      setLoading(false);
    })();
  }, [params.id]);

  async function toggleSave() {
    setSaved((s) => !s);
    await fetch(`/api/jobs/${params.id}/save`, { method: saved ? "DELETE" : "POST" });
  }

  async function submitApplication() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: params.id, coverLetter, resumeId: resumeId || undefined }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setAlreadyApplied(true);
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          This job could not be found. It may have closed.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
                <Link href={`/company/${job.company.slug}`} className="text-sm text-primary hover:underline">
                  {job.company.name}
                </Link>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.workplaceType === "REMOTE" ? "Remote" : job.workplaceType === "HYBRID" ? "Hybrid" : "On-site"}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </span>
                </div>
              </div>
              {authed && (
                <Button variant="ghost" size="icon" onClick={toggleSave} aria-label="Save job">
                  {saved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <Badge key={s.name} variant={s.required ? "default" : "outline"}>
                  {s.name}
                </Badge>
              ))}
            </div>

            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground">{job.description}</p>
          </CardContent>
        </Card>

        <div className="mt-4">
          {!authed ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <p className="text-sm text-muted-foreground">Log in to see your match score and apply.</p>
                <Button asChild>
                  <Link href={`/login?next=/jobs/${params.id}`}>Log in</Link>
                </Button>
              </CardContent>
            </Card>
          ) : alreadyApplied ? (
            <Card className="border-success/40">
              <CardContent className="flex items-center gap-2 p-6 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> You've applied to this job.
              </CardContent>
            </Card>
          ) : applying ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                {resumes.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Resume</Label>
                    <Select value={resumeId} onValueChange={setResumeId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                            {r.isPrimary ? " (Primary)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">Cover letter (optional)</p>
                <Textarea
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Add a short note for this application."
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button onClick={submitApplication} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit application
                  </Button>
                  <Button variant="ghost" onClick={() => setApplying(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button size="lg" onClick={() => setApplying(true)}>
              Apply
            </Button>
          )}
        </div>
      </div>

      {authed && match && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your match</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-6 pt-0">
              <CircularProgress value={match.score} size={110} />
              <div className="w-full space-y-2 text-sm">
                {[
                  ["Skills", match.skillsScore],
                  ["Title & level", match.titleScore],
                  ["Experience", match.experienceScore],
                  ["Location", match.locationScore],
                  ["Salary", match.salaryScore],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {match.reasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Why you match</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {match.reasons.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {match.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Potential gaps</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {match.gaps.map((g) => (
                    <li key={g}>· {g}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
