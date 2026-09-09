"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, Star, Loader2, Trash2, ScanSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResumeSummary {
  id: string;
  name: string;
  isPrimary: boolean;
  updatedAt: string;
}

export default function ResumeStudioPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((json) => setResumes(json.data?.resumes ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function createResume(fromProfile: boolean) {
    setCreating(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fromProfile ? "My Resume" : "Untitled Resume", fromProfile }),
    });
    const json = await res.json();
    setCreating(false);
    if (res.ok) router.push(`/resume-studio/${json.data.resume.id}`);
  }

  async function remove(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Resume Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build and tailor resumes from your Career Profile.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/ats-scanner">
            <ScanSearch className="h-4 w-4" /> ATS Scanner
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex gap-3">
        <Button onClick={() => createResume(true)} disabled={creating}>
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Build from my profile
        </Button>
        <Button variant="secondary" onClick={() => createResume(false)} disabled={creating}>
          <Plus className="h-4 w-4" /> Start blank
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No resumes yet. Build one from your profile to get started fast.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <Link href={`/resume-studio/${resume.id}`} className="flex flex-1 items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.isPrimary && (
                    <Badge variant="brand" className="ml-2">
                      <Star className="mr-1 h-3 w-3" /> Primary
                    </Badge>
                  )}
                </Link>
                <Button variant="ghost" size="icon" onClick={() => remove(resume.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
