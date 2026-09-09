import { z } from "zod";
import { CAREER_LEVELS, EMPLOYMENT_TYPES, WORKPLACE_TYPES } from "@/lib/validations/profile";

export const companyInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  industry: z.string().trim().max(160).optional().or(z.literal("")),
  size: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});
export type CompanyInput = z.infer<typeof companyInputSchema>;

export const jobInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(8000),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  workplaceType: z.enum(WORKPLACE_TYPES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  careerLevel: z.enum(CAREER_LEVELS).optional().nullable(),
  salaryMin: z.coerce.number().int().min(0).optional().nullable(),
  salaryMax: z.coerce.number().int().min(0).optional().nullable(),
  salaryCurrency: z.string().trim().length(3).default("USD"),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});
export type JobInput = z.infer<typeof jobInputSchema>;

export const JOB_STATUSES = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"] as const;
export const jobStatusUpdateSchema = z.object({ status: z.enum(JOB_STATUSES) });

export const APPLICATION_STATUSES = [
  "APPLIED",
  "VIEWED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;
export const applicationStatusUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const contactCandidateSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
});
