"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SkillInput, CAREER_LEVELS, WORKPLACE_TYPES, EMPLOYMENT_TYPES, SPONSORSHIP_STATUSES } from "@/lib/validations/profile";
import {
  IdentityStep,
  ProfessionalStep,
  SkillsStep,
  PreferencesStep,
  WorkAuthStep,
  GoalsStep,
} from "@/components/onboarding/steps";

export interface OnboardingData {
  location: string;
  phone: string;
  headline: string;
  bio: string;
  currentTitle: string;
  currentCompany: string;
  totalExperienceYears: number | null;
  careerLevel: (typeof CAREER_LEVELS)[number] | null;
  industry: string;
  skills: SkillInput[];
  languages: { language: string; proficiency: "BASIC" | "CONVERSATIONAL" | "FLUENT" | "NATIVE" }[];
  desiredTitles: string[];
  desiredIndustries: string[];
  desiredLocations: string[];
  workplaceTypes: (typeof WORKPLACE_TYPES)[number][];
  employmentTypes: (typeof EMPLOYMENT_TYPES)[number][];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  noticePeriodDays: number | null;
  workAuthorization: string;
  sponsorshipStatus: (typeof SPONSORSHIP_STATUSES)[number];
  willingToRelocate: boolean;
  targetTitles: string[];
  targetCompanies: string[];
  careerGoals: string;
}

export const ONBOARDING_STEPS = [
  { title: "Identity", subtitle: "Tell us who you are.", Component: IdentityStep, endpoint: "/api/onboarding/identity", pick: (d: OnboardingData) => ({ location: d.location, phone: d.phone, headline: d.headline, bio: d.bio }) },
  { title: "Professional background", subtitle: "Where are you in your career today?", Component: ProfessionalStep, endpoint: "/api/onboarding/professional", pick: (d: OnboardingData) => ({ currentTitle: d.currentTitle, currentCompany: d.currentCompany, totalExperienceYears: d.totalExperienceYears, careerLevel: d.careerLevel, industry: d.industry }) },
  { title: "Skills", subtitle: "What are you good at?", Component: SkillsStep, endpoint: "/api/onboarding/skills", pick: (d: OnboardingData) => ({ skills: d.skills, languages: d.languages }) },
  { title: "Job preferences", subtitle: "What are you looking for?", Component: PreferencesStep, endpoint: "/api/onboarding/preferences", pick: (d: OnboardingData) => ({ desiredTitles: d.desiredTitles, desiredIndustries: d.desiredIndustries, desiredLocations: d.desiredLocations, workplaceTypes: d.workplaceTypes, employmentTypes: d.employmentTypes, desiredSalaryMin: d.desiredSalaryMin, desiredSalaryMax: d.desiredSalaryMax, noticePeriodDays: d.noticePeriodDays }) },
  { title: "Work authorization", subtitle: "So Career OS never guesses at this.", Component: WorkAuthStep, endpoint: "/api/onboarding/work-auth", pick: (d: OnboardingData) => ({ workAuthorization: d.workAuthorization, sponsorshipStatus: d.sponsorshipStatus, willingToRelocate: d.willingToRelocate }) },
  { title: "Career goals", subtitle: "Where do you want to go?", Component: GoalsStep, endpoint: "/api/onboarding/goals", pick: (d: OnboardingData) => ({ targetTitles: d.targetTitles, targetCompanies: d.targetCompanies, careerGoals: d.careerGoals }) },
] as const;

const SKIPPABLE_FROM_STEP = 2; // steps 3-6 (index >= 2) can be skipped

interface OnboardingWizardProps {
  initialStep: number;
  initialData: OnboardingData;
}

export function OnboardingWizard({ initialStep, initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, ONBOARDING_STEPS.length - 1));
  const [data, setData] = useState<OnboardingData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  async function submitStep() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(step.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step.pick(data)),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }

      if (isLast) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setStepIndex((i) => i + 1);
    } catch {
      setError("Something went wrong. Your progress up to this step is saved.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    if (isLast) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  const canSkip = stepIndex >= SKIPPABLE_FROM_STEP;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
          </span>
          <span>{step.title}</span>
        </div>
        <Progress value={((stepIndex + 1) / ONBOARDING_STEPS.length) * 100} />
      </div>

      <h1 className="text-2xl font-semibold text-foreground">{step.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>

      <div className="mt-6">
        <step.Component data={data} update={update} />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={stepIndex === 0 || saving}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {canSkip && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          )}
          <Button type="button" onClick={submitStep} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLast ? "Finish" : "Continue"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
