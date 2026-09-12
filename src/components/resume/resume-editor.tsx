"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, Loader2, Check, Star, Printer, Target, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import { MicButton } from "@/components/voice/mic-button";
import type { ResumeContent, ResumeExperience, ResumeEducation } from "@/lib/validations/resume";

interface TargetJob {
  id: string;
  title: string;
  company: string;
  status: string;
}

interface ResumeEditorProps {
  resumeId: string;
  initialName: string;
  initialIsPrimary: boolean;
  initialContent: ResumeContent;
  initialTargetJob: TargetJob | null;
}

interface JobSearchResult {
  id: string;
  title: string;
  company: { name: string };
}

const EMPTY_EXPERIENCE: ResumeExperience = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  bullets: [],
};

const EMPTY_EDUCATION: ResumeEducation = { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" };

export function ResumeEditor({ resumeId, initialName, initialIsPrimary, initialContent, initialTargetJob }: ResumeEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isPrimary, setIsPrimary] = useState(initialIsPrimary);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [improvingSummary, setImprovingSummary] = useState(false);
  const [rewritingBulletKey, setRewritingBulletKey] = useState<string | null>(null);
  const [targetJob, setTargetJob] = useState<TargetJob | null>(initialTargetJob);
  const [jobQuery, setJobQuery] = useState("");
  const [jobResults, setJobResults] = useState<JobSearchResult[]>([]);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [settingTarget, setSettingTarget] = useState(false);

  function update(patch: Partial<ResumeContent>) {
    setContent((prev) => ({ ...prev, ...patch }));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/resumes/${resumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isPrimary, content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function remove() {
    await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
    router.push("/resume-studio");
  }

  async function searchJobs(q: string) {
    setJobQuery(q);
    if (q.trim().length < 2) {
      setJobResults([]);
      return;
    }
    setSearchingJobs(true);
    const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setSearchingJobs(false);
    if (res.ok) setJobResults(json.data.jobs.slice(0, 6));
  }

  async function setTarget(job: JobSearchResult | null) {
    setSettingTarget(true);
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetJobId: job ? job.id : null }),
    });
    setSettingTarget(false);
    if (!res.ok) return;
    setTargetJob(job ? { id: job.id, title: job.title, company: job.company.name, status: "OPEN" } : null);
    setJobQuery("");
    setJobResults([]);
  }

  async function improveSummary() {
    setImprovingSummary(true);
    const res = await fetch(`/api/resumes/${resumeId}/ai/improve-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSummary: content.summary }),
    });
    const json = await res.json();
    setImprovingSummary(false);
    if (res.ok) update({ summary: json.text });
  }

  function updateExperience(index: number, patch: Partial<ResumeExperience>) {
    const next = [...content.experience];
    next[index] = { ...next[index], ...patch };
    update({ experience: next });
  }

  function addExperience() {
    update({ experience: [...content.experience, { ...EMPTY_EXPERIENCE }] });
  }

  function removeExperience(index: number) {
    update({ experience: content.experience.filter((_, i) => i !== index) });
  }

  function updateBullet(expIndex: number, bulletIndex: number, text: string) {
    const bullets = [...content.experience[expIndex].bullets];
    bullets[bulletIndex] = text;
    updateExperience(expIndex, { bullets });
  }

  function addBullet(expIndex: number) {
    updateExperience(expIndex, { bullets: [...content.experience[expIndex].bullets, ""] });
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    updateExperience(expIndex, {
      bullets: content.experience[expIndex].bullets.filter((_, i) => i !== bulletIndex),
    });
  }

  async function rewriteBullet(expIndex: number, bulletIndex: number) {
    const key = `${expIndex}-${bulletIndex}`;
    setRewritingBulletKey(key);
    const exp = content.experience[expIndex];
    const res = await fetch(`/api/resumes/${resumeId}/ai/rewrite-bullet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullet: exp.bullets[bulletIndex], jobTitle: exp.title }),
    });
    const json = await res.json();
    setRewritingBulletKey(null);
    if (res.ok) updateBullet(expIndex, bulletIndex, json.text);
  }

  function updateEducation(index: number, patch: Partial<ResumeEducation>) {
    const next = [...content.education];
    next[index] = { ...next[index], ...patch };
    update({ education: next });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs text-lg font-semibold"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={isPrimary ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsPrimary((p) => !p)}
          >
            <Star className={isPrimary ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
            {isPrimary ? "Primary" : "Set as primary"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete resume">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saved && <Check className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> Tailor to a job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {targetJob ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {targetJob.title} <span className="text-muted-foreground">· {targetJob.company}</span>
                </p>
                {targetJob.status !== "OPEN" ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> This job is no longer available — pick another target.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI rewrites on this resume are tailored toward this role automatically.
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTarget(null)} disabled={settingTarget} aria-label="Clear target job">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={jobQuery}
                onChange={(e) => searchJobs(e.target.value)}
                placeholder="Search open jobs on Career OS to tailor toward…"
              />
              {searchingJobs && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {jobResults.length > 0 && (
                <div className="space-y-1">
                  {jobResults.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setTarget(job)}
                      disabled={settingTarget}
                      className="flex w-full items-center justify-between rounded-md border border-border p-2 text-left text-sm hover:bg-surface-raised"
                    >
                      <span>
                        {job.title} <span className="text-muted-foreground">· {job.company.name}</span>
                      </span>
                      <Badge variant="outline">Target</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Summary</CardTitle>
          <Button variant="ghost" size="sm" onClick={improveSummary} disabled={improvingSummary}>
            {improvingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Improve with AI
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Textarea
              rows={4}
              value={content.summary}
              onChange={(e) => update({ summary: e.target.value })}
              placeholder="A 2-3 sentence summary of your experience and what you're looking for."
              className="pb-12"
            />
            <MicButton
              className="absolute bottom-2 right-2"
              onFinalText={(text) => update({ summary: content.summary ? `${content.summary} ${text}` : text })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input value={content.links.linkedin} onChange={(e) => update({ links: { ...content.links, linkedin: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label>GitHub</Label>
            <Input value={content.links.github} onChange={(e) => update({ links: { ...content.links, github: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label>Portfolio</Label>
            <Input value={content.links.portfolio} onChange={(e) => update({ links: { ...content.links, portfolio: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Experience</CardTitle>
          <Button variant="ghost" size="sm" onClick={addExperience}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.experience.map((exp, i) => (
            <div key={i} className="space-y-3 border-b border-border pb-6 last:border-0 last:pb-0">
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => removeExperience(i)} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Title" value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} />
                <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Location" value={exp.location} onChange={(e) => updateExperience(i, { location: e.target.value })} />
                <Input placeholder="Start (e.g. Jan 2021)" value={exp.startDate} onChange={(e) => updateExperience(i, { startDate: e.target.value })} />
                <Input
                  placeholder="End (or Present)"
                  value={exp.isCurrent ? "Present" : exp.endDate}
                  disabled={exp.isCurrent}
                  onChange={(e) => updateExperience(i, { endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {exp.bullets.map((bullet, bi) => (
                  <div key={bi} className="flex items-start gap-2">
                    <Textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => updateBullet(i, bi, e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <MicButton onFinalText={(text) => updateBullet(i, bi, bullet ? `${bullet} ${text}` : text)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => rewriteBullet(i, bi)}
                        disabled={rewritingBulletKey === `${i}-${bi}`}
                        aria-label="Rewrite with AI"
                      >
                        {rewritingBulletKey === `${i}-${bi}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeBullet(i, bi)} aria-label="Remove bullet">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addBullet(i)}>
                  <Plus className="h-4 w-4" /> Add bullet
                </Button>
              </div>
            </div>
          ))}
          {content.experience.length === 0 && (
            <p className="text-sm text-muted-foreground">No experience added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Education</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => update({ education: [...content.education, { ...EMPTY_EDUCATION }] })}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.education.map((edu, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <Input placeholder="School" value={edu.school} onChange={(e) => updateEducation(i, { school: e.target.value })} />
              <Input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} />
              <Input placeholder="Field of study" value={edu.fieldOfStudy} onChange={(e) => updateEducation(i, { fieldOfStudy: e.target.value })} />
              <Input placeholder="Year" value={edu.endDate} onChange={(e) => updateEducation(i, { endDate: e.target.value })} />
            </div>
          ))}
          {content.education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput value={content.skills} onChange={(skills) => update({ skills })} placeholder="Add a skill…" max={30} />
        </CardContent>
      </Card>
    </div>
  );
}
