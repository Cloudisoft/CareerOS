"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { CAREER_LEVELS, EMPLOYMENT_TYPES, WORKPLACE_TYPES } from "@/lib/validations/profile";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workplaceType, setWorkplaceType] = useState<string>("ONSITE");
  const [employmentType, setEmploymentType] = useState<string>("FULL_TIME");
  const [careerLevel, setCareerLevel] = useState<string>("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ postedToday: number; perDay: number } | null>(null);

  // Daily posting allowance from the firm's Recruiter Suite plan.
  useEffect(() => {
    fetch("/api/enterprise/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data?.jobs && setQuota({ postedToday: j.data.jobs.postedToday, perDay: j.data.jobs.perDay }))
      .catch(() => {});
  }, []);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/employer/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        location,
        workplaceType,
        employmentType,
        careerLevel: careerLevel || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryCurrency: "USD",
        skills,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      setErrorCode(json.error?.code ?? null);
      return;
    }
    router.push(`/employer/jobs/${json.data.job.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Post a job</h1>
      {quota && (
        <p className="mb-6 text-sm text-muted-foreground">
          {quota.perDay > 0 ? (
            <>
              {Math.max(0, quota.perDay - quota.postedToday)} of {quota.perDay} job posts left today (resets at midnight UTC).
            </>
          ) : (
            <>
              Posting jobs needs the Recruiter Suite.{" "}
              <Link href="/employer/enterprise" className="text-primary hover:underline">Start a free trial or see plans</Link>
            </>
          )}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Job title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities, requirements, benefits…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Workplace type</Label>
              <Select value={workplaceType} onValueChange={setWorkplaceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKPLACE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label>Career level</Label>
              <Select value={careerLevel} onValueChange={setCareerLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="salaryMin">Salary min (USD)</Label>
              <Input id="salaryMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMax">Salary max (USD)</Label>
              <Input id="salaryMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Required skills</Label>
            <TagInput value={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}{" "}
              {(errorCode === "UPGRADE_REQUIRED" || errorCode === "QUOTA_EXCEEDED") && (
                <Link href="/employer/enterprise/billing" className="text-primary underline">
                  {errorCode === "QUOTA_EXCEEDED" ? "Need more? See plans" : "See plans"}
                </Link>
              )}
            </p>
          )}

          <Button onClick={submit} disabled={saving || !title.trim() || !description.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish job
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
