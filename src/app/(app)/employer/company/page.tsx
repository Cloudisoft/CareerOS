"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CompanyForm {
  name: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  linkedinUrl: string;
  logoUrl: string;
}

const EMPTY: CompanyForm = {
  name: "",
  description: "",
  industry: "",
  size: "",
  location: "",
  website: "",
  linkedinUrl: "",
  logoUrl: "",
};

export default function EmployerCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/employer/company")
      .then((r) => r.json())
      .then((json) => {
        const company = json.data?.company;
        if (company) {
          setSlug(company.slug);
          setForm({
            name: company.name ?? "",
            description: company.description ?? "",
            industry: company.industry ?? "",
            size: company.size ?? "",
            location: company.location ?? "",
            website: company.website ?? "",
            linkedinUrl: company.linkedinUrl ?? "",
            logoUrl: company.logoUrl ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/employer/company", {
      method: slug ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setSlug(json.data.company.slug);
    setSaved(true);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{slug ? "Company profile" : "Set up your company"}</h1>
          <p className="text-sm text-muted-foreground">
            {slug ? "Shown to candidates on your public company page and job postings." : "This unlocks job posting and Talent Search."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            {slug ? (
              <>
                Public page: <span className="text-foreground">/company/{slug}</span>
              </>
            ) : (
              "Your public page URL is generated from your company name."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does your company do?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="size">Company size</Label>
              <Input
                id="size"
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="e.g. 51-200 employees"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Headquarters location</Label>
            <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                value={form.linkedinUrl}
                onChange={(e) => set("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/company/…"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-success">Saved.</p>}

          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {slug ? "Save changes" : "Create company"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
