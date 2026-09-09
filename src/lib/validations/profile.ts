import { z } from "zod";

export const CAREER_LEVELS = ["ENTRY", "ASSOCIATE", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "EXECUTIVE"] as const;
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"] as const;
export const WORKPLACE_TYPES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const SPONSORSHIP_STATUSES = ["NOT_REQUIRED", "REQUIRED", "MAY_REQUIRE_FUTURE"] as const;
export const SKILL_TYPES = ["TECHNICAL", "SOFT", "TOOL"] as const;
export const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export const LANGUAGE_PROFICIENCIES = ["BASIC", "CONVERSATIONAL", "FLUENT", "NATIVE"] as const;

export const identityStepSchema = z.object({
  location: z.string().trim().max(160).optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});
export type IdentityStepInput = z.infer<typeof identityStepSchema>;

export const professionalStepSchema = z.object({
  currentTitle: z.string().trim().max(160).optional().or(z.literal("")),
  currentCompany: z.string().trim().max(160).optional().or(z.literal("")),
  totalExperienceYears: z.coerce.number().min(0).max(60).optional().nullable(),
  careerLevel: z.enum(CAREER_LEVELS).optional().nullable(),
  industry: z.string().trim().max(160).optional().or(z.literal("")),
});
export type ProfessionalStepInput = z.infer<typeof professionalStepSchema>;

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(SKILL_TYPES).default("TECHNICAL"),
  level: z.enum(SKILL_LEVELS).default("INTERMEDIATE"),
});
export type SkillInput = z.infer<typeof skillInputSchema>;

export const skillsStepSchema = z.object({
  skills: z.array(skillInputSchema).max(50),
  languages: z
    .array(
      z.object({
        language: z.string().trim().min(1).max(60),
        proficiency: z.enum(LANGUAGE_PROFICIENCIES).default("CONVERSATIONAL"),
      })
    )
    .max(20),
});
export type SkillsStepInput = z.infer<typeof skillsStepSchema>;

export const preferencesStepSchema = z.object({
  desiredTitles: z.array(z.string().trim().min(1).max(120)).max(10),
  desiredIndustries: z.array(z.string().trim().min(1).max(120)).max(10),
  desiredLocations: z.array(z.string().trim().min(1).max(120)).max(10),
  workplaceTypes: z.array(z.enum(WORKPLACE_TYPES)).max(3),
  employmentTypes: z.array(z.enum(EMPLOYMENT_TYPES)).max(5),
  desiredSalaryMin: z.coerce.number().min(0).optional().nullable(),
  desiredSalaryMax: z.coerce.number().min(0).optional().nullable(),
  noticePeriodDays: z.coerce.number().min(0).max(365).optional().nullable(),
});
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;

export const workAuthStepSchema = z.object({
  workAuthorization: z.string().trim().max(160).optional().or(z.literal("")),
  sponsorshipStatus: z.enum(SPONSORSHIP_STATUSES).default("NOT_REQUIRED"),
  willingToRelocate: z.boolean().default(false),
});
export type WorkAuthStepInput = z.infer<typeof workAuthStepSchema>;

export const goalsStepSchema = z.object({
  targetTitles: z.array(z.string().trim().min(1).max(120)).max(10),
  targetCompanies: z.array(z.string().trim().min(1).max(120)).max(10),
  careerGoals: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type GoalsStepInput = z.infer<typeof goalsStepSchema>;

export const workExperienceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  company: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  achievements: z.array(z.string().trim().min(1).max(400)).max(10).default([]),
});

export const educationSchema = z.object({
  school: z.string().trim().min(1).max(160),
  degree: z.string().trim().max(160).optional().or(z.literal("")),
  fieldOfStudy: z.string().trim().max(160).optional().or(z.literal("")),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
