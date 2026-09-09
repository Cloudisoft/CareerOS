"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  IdentityStep,
  ProfessionalStep,
  SkillsStep,
  PreferencesStep,
  WorkAuthStep,
  GoalsStep,
} from "@/components/onboarding/steps";
import { ONBOARDING_STEPS, type OnboardingData } from "@/components/onboarding/wizard";
import { ExperienceEditor, type ExperienceItem } from "@/components/profile/experience-editor";
import { EducationEditor, type EducationItem } from "@/components/profile/education-editor";

const SECTIONS = [
  { key: "identity", label: "About", stepIndex: 0, Component: IdentityStep },
  { key: "professional", label: "Professional", stepIndex: 1, Component: ProfessionalStep },
  { key: "skills", label: "Skills", stepIndex: 2, Component: SkillsStep },
  { key: "preferences", label: "Preferences", stepIndex: 3, Component: PreferencesStep },
  { key: "work-auth", label: "Work Authorization", stepIndex: 4, Component: WorkAuthStep },
  { key: "goals", label: "Career Goals", stepIndex: 5, Component: GoalsStep },
] as const;

function SectionEditor({ stepIndex, Component, data, setData }: { stepIndex: number; Component: typeof IdentityStep; data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepConfig = ONBOARDING_STEPS[stepIndex];

  function update(patch: Partial<OnboardingData>) {
    setData({ ...data, ...patch });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(stepConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepConfig.pick(data)),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Component data={data} update={update} />
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}

export function ProfileEditor({
  initialData,
  initialExperiences,
  initialEducation,
}: {
  initialData: OnboardingData;
  initialExperiences: ExperienceItem[];
  initialEducation: EducationItem[];
}) {
  const [data, setData] = useState(initialData);

  return (
    <Tabs defaultValue="identity">
      <TabsList className="flex-wrap">
        {SECTIONS.map((s) => (
          <TabsTrigger key={s.key} value={s.key}>
            {s.label}
          </TabsTrigger>
        ))}
        <TabsTrigger value="experience">Experience</TabsTrigger>
        <TabsTrigger value="education">Education</TabsTrigger>
      </TabsList>

      {SECTIONS.map((s) => (
        <TabsContent key={s.key} value={s.key}>
          <SectionEditor stepIndex={s.stepIndex} Component={s.Component} data={data} setData={setData} />
        </TabsContent>
      ))}

      <TabsContent value="experience">
        <div className="max-w-2xl">
          <ExperienceEditor initial={initialExperiences} />
        </div>
      </TabsContent>
      <TabsContent value="education">
        <div className="max-w-2xl">
          <EducationEditor initial={initialEducation} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
