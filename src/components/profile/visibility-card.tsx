"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OPTIONS = [
  { value: "PUBLIC", label: "Public", description: "Visible to any employer searching Talent Search." },
  { value: "RECRUITERS_ONLY", label: "Recruiters only", description: "Visible to employers, hidden from other candidates." },
  { value: "PRIVATE_UNTIL_APPLY", label: "Private until you apply", description: "Only visible to a company after you apply to one of their jobs." },
  { value: "PRIVATE", label: "Private", description: "Never shown in Talent Search, even after applying." },
] as const;

export function VisibilityCard({ initialVisibility }: { initialVisibility: string }) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [saving, setSaving] = useState(false);

  async function update(value: string) {
    setVisibility(value);
    setSaving(true);
    await fetch("/api/profile/visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: value }),
    });
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recruiter visibility</CardTitle>
        <CardDescription>Controls whether employers can find you in Talent Search.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select value={visibility} onValueChange={update} disabled={saving}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {OPTIONS.find((o) => o.value === visibility)?.description}
          {saving && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
        </p>
      </CardContent>
    </Card>
  );
}
