"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/ui/tag-input";
import { SkillPicker } from "@/components/onboarding/skill-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAREER_LEVELS, EMPLOYMENT_TYPES, WORKPLACE_TYPES, SPONSORSHIP_STATUSES } from "@/lib/validations/profile";
import type { OnboardingData } from "@/components/onboarding/wizard";

const LABELS: Record<string, string> = {
  ENTRY: "Entry level",
  ASSOCIATE: "Associate",
  MID: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
  DIRECTOR: "Director",
  EXECUTIVE: "Executive",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
  NOT_REQUIRED: "I don't need sponsorship",
  REQUIRED: "I require visa sponsorship",
  MAY_REQUIRE_FUTURE: "I may need sponsorship in the future",
};

interface StepProps {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}

export function IdentityStep({ data, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="San Francisco, CA"
          value={data.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={data.phone} onChange={(e) => update({ phone: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          placeholder="Senior Backend Engineer building fintech infrastructure"
          value={data.headline}
          onChange={(e) => update({ headline: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="A couple sentences about your background and what you're looking for."
          value={data.bio}
          onChange={(e) => update({ bio: e.target.value })}
        />
      </div>
    </div>
  );
}

export function ProfessionalStep({ data, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="currentTitle">Current title</Label>
          <Input
            id="currentTitle"
            value={data.currentTitle}
            onChange={(e) => update({ currentTitle: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentCompany">Current company</Label>
          <Input
            id="currentCompany"
            value={data.currentCompany}
            onChange={(e) => update({ currentCompany: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="totalExperienceYears">Years of experience</Label>
          <Input
            id="totalExperienceYears"
            type="number"
            min={0}
            max={60}
            value={data.totalExperienceYears ?? ""}
            onChange={(e) => update({ totalExperienceYears: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Career level</Label>
          <Select value={data.careerLevel ?? undefined} onValueChange={(v) => update({ careerLevel: v as OnboardingData["careerLevel"] })}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {CAREER_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          placeholder="Fintech, Healthcare, SaaS…"
          value={data.industry}
          onChange={(e) => update({ industry: e.target.value })}
        />
      </div>
    </div>
  );
}

export function SkillsStep({ data, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Skills</Label>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Add your strongest technical skills, tools, and soft skills.
        </p>
        <SkillPicker value={data.skills} onChange={(skills) => update({ skills })} />
      </div>
      <div>
        <Label>Languages</Label>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">Optional — press enter to add.</p>
        <TagInput
          value={data.languages.map((l) => l.language)}
          onChange={(languages) =>
            update({ languages: languages.map((language) => ({ language, proficiency: "CONVERSATIONAL" as const })) })
          }
          placeholder="English, Spanish…"
          max={10}
        />
      </div>
    </div>
  );
}

export function PreferencesStep({ data, update }: StepProps) {
  function toggleFromArray<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Desired roles</Label>
        <TagInput
          value={data.desiredTitles}
          onChange={(desiredTitles) => update({ desiredTitles })}
          placeholder="Staff Engineer, Engineering Manager…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Desired locations</Label>
        <TagInput
          value={data.desiredLocations}
          onChange={(desiredLocations) => update({ desiredLocations })}
          placeholder="New York, Remote…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Desired industries</Label>
        <TagInput
          value={data.desiredIndustries}
          onChange={(desiredIndustries) => update({ desiredIndustries })}
          placeholder="Fintech, Healthcare…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Workplace type</Label>
        <div className="flex gap-4">
          {WORKPLACE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={data.workplaceTypes.includes(type)}
                onCheckedChange={() => update({ workplaceTypes: toggleFromArray(data.workplaceTypes, type) })}
              />
              {LABELS[type]}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Employment type</Label>
        <div className="flex flex-wrap gap-4">
          {EMPLOYMENT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={data.employmentTypes.includes(type)}
                onCheckedChange={() => update({ employmentTypes: toggleFromArray(data.employmentTypes, type) })}
              />
              {LABELS[type]}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Minimum salary (USD)</Label>
          <Input
            id="salaryMin"
            type="number"
            value={data.desiredSalaryMin ?? ""}
            onChange={(e) => update({ desiredSalaryMin: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Maximum salary (USD)</Label>
          <Input
            id="salaryMax"
            type="number"
            value={data.desiredSalaryMax ?? ""}
            onChange={(e) => update({ desiredSalaryMax: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notice">Notice period (days)</Label>
        <Input
          id="notice"
          type="number"
          className="max-w-[10rem]"
          value={data.noticePeriodDays ?? ""}
          onChange={(e) => update({ noticePeriodDays: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    </div>
  );
}

export function WorkAuthStep({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="workAuth">Work authorization</Label>
        <Input
          id="workAuth"
          placeholder="e.g. U.S. Citizen, Green Card, H-1B…"
          value={data.workAuthorization}
          onChange={(e) => update({ workAuthorization: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Sponsorship</Label>
        {SPONSORSHIP_STATUSES.map((status) => (
          <label key={status} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="sponsorship"
              checked={data.sponsorshipStatus === status}
              onChange={() => update({ sponsorshipStatus: status })}
              className="h-4 w-4 accent-primary"
            />
            {LABELS[status]}
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={data.willingToRelocate}
          onCheckedChange={(checked) => update({ willingToRelocate: Boolean(checked) })}
        />
        I'm willing to relocate
      </label>
    </div>
  );
}

export function GoalsStep({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Target positions</Label>
        <TagInput
          value={data.targetTitles}
          onChange={(targetTitles) => update({ targetTitles })}
          placeholder="VP of Engineering, Principal Engineer…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Target companies</Label>
        <TagInput
          value={data.targetCompanies}
          onChange={(targetCompanies) => update({ targetCompanies })}
          placeholder="Stripe, Anthropic…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="careerGoals">Career goals</Label>
        <Textarea
          id="careerGoals"
          rows={4}
          placeholder="Where do you want your career to go in the next 2-3 years?"
          value={data.careerGoals}
          onChange={(e) => update({ careerGoals: e.target.value })}
        />
      </div>
    </div>
  );
}
