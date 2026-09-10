import { z } from "zod";

export const resumeExperienceSchema = z.object({
  title: z.string().trim().max(160).default(""),
  company: z.string().trim().max(160).default(""),
  location: z.string().trim().max(160).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string().trim().max(400)).default([]),
});

export const resumeEducationSchema = z.object({
  school: z.string().trim().max(160).default(""),
  degree: z.string().trim().max(160).default(""),
  fieldOfStudy: z.string().trim().max(160).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
});

export const resumeCertificationSchema = z.object({
  name: z.string().trim().max(160).default(""),
  issuer: z.string().trim().max(160).default(""),
  year: z.string().trim().max(10).default(""),
});

export const resumeContentSchema = z.object({
  summary: z.string().trim().max(1200).default(""),
  links: z
    .object({
      linkedin: z.string().trim().max(300).default(""),
      github: z.string().trim().max(300).default(""),
      portfolio: z.string().trim().max(300).default(""),
    })
    .default({ linkedin: "", github: "", portfolio: "" }),
  experience: z.array(resumeExperienceSchema).default([]),
  education: z.array(resumeEducationSchema).default([]),
  skills: z.array(z.string().trim().max(80)).default([]),
  certifications: z.array(resumeCertificationSchema).default([]),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type ResumeEducation = z.infer<typeof resumeEducationSchema>;

export const createResumeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  fromProfile: z.boolean().optional(),
});

export const updateResumeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  isPrimary: z.boolean().optional(),
  content: resumeContentSchema.optional(),
  /** The live job to tailor this resume against. Pass null to clear it. */
  targetJobId: z.string().trim().min(1).nullable().optional(),
});

export const rewriteBulletSchema = z.object({
  bullet: z.string().trim().min(1).max(500),
  jobTitle: z.string().trim().max(160).optional(),
  jobDescription: z.string().trim().max(4000).optional(),
});

export const improveSummarySchema = z.object({
  currentSummary: z.string().trim().max(1200).optional(),
  jobDescription: z.string().trim().max(4000).optional(),
});

export const atsScanSchema = z.object({
  resumeId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  jobDescription: z.string().trim().max(8000).optional(),
});

export const generateCoverLetterSchema = z.object({
  jobId: z.string().min(1).optional(),
  jobTitle: z.string().trim().max(160).default(""),
  companyName: z.string().trim().max(160).default(""),
  jobDescription: z.string().trim().max(8000).default(""),
  tone: z.enum(["professional", "enthusiastic", "concise"]).default("professional"),
});
