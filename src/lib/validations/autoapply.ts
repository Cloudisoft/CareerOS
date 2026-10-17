import { z } from "zod";

export const updateAutoApplySettingsSchema = z.object({
  minMatchScore: z.coerce.number().int().min(0).max(100),
  monthlyLimit: z.coerce.number().int().min(0).max(100000),
  pacingSeconds: z.coerce.number().int().min(10).max(600),
  concurrency: z.coerce.number().int().min(1).max(6),
  autoSubmit: z.boolean(),
});

/** Settings changed in the extension's own options page. Every field is optional: only what changed is sent. */
export const extensionSettingsSchema = z.object({
  minMatchScore: z.coerce.number().int().min(0).max(100).optional(),
  pacingSeconds: z.coerce.number().int().min(10).max(600).optional(),
  concurrency: z.coerce.number().int().min(1).max(6).optional(),
  autoSubmit: z.boolean().optional(),
  platformModes: z
    .record(z.string().max(40), z.enum(["default", "auto", "assist", "discover"]))
    .refine((m) => Object.keys(m).length <= 60, "Too many platforms")
    .optional(),
});

const text = (max: number) => z.string().trim().max(max).optional();
const list = (max: number) => z.array(z.string().trim().max(200)).max(max).optional();

/** Profile fields edited in the extension that have a home in the Career Profile. */
export const extensionProfileSchema = z.object({
  identity: z
    .object({
      firstName: text(100),
      lastName: text(100),
      phone: text(40),
      city: text(120),
      state: text(120),
      country: text(120),
      linkedin: text(500),
      github: text(500),
      portfolio: text(500),
    })
    .partial()
    .optional(),
  targeting: z
    .object({
      titles: list(30),
      locations: list(30),
      workModes: list(3),
      minSalary: z.coerce.number().int().min(0).max(100_000_000).optional(),
      salaryCurrency: text(10),
    })
    .partial()
    .optional(),
  experience: z
    .object({
      currentTitle: text(200),
      currentCompany: text(200),
      totalYears: z.coerce.number().min(0).max(70).optional(),
      noticePeriod: text(60),
    })
    .partial()
    .optional(),
  workAuth: z
    .object({
      authorizedIn: list(10),
      needsSponsorship: z.boolean().optional(),
      willingToRelocate: z.boolean().optional(),
    })
    .partial()
    .optional(),
  narrative: z.object({ summary: text(5000) }).partial().optional(),
});

export const extensionSyncQuerySchema = z.object({});

export const extensionApplicationSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  title: z.string().trim().max(200).default(""),
  company: z.string().trim().max(200).default(""),
  ats: z.string().trim().max(60).default(""),
  matchScore: z.coerce.number().min(0).max(100).default(0),
  outcome: z.enum(["submitted", "assisted"]),
  detail: z.string().trim().max(500).optional(),
});

export const extensionPackageSubmittedSchema = z.object({
  applicationId: z.string().trim().min(1),
});

export const extensionPackageRequestSchema = z.object({
  jobUrl: z.string().trim().min(1).max(2000),
  title: z.string().trim().max(200).default(""),
  company: z.string().trim().max(200).default(""),
  description: z.string().trim().max(8000).default(""),
  ats: z.string().trim().max(60).default(""),
});

export const extensionRunSchema = z.object({
  runId: z.string().trim().min(1).max(120),
  status: z.enum(["running", "finished"]),
  queued: z.coerce.number().int().min(0),
  submitted: z.coerce.number().int().min(0),
  assisted: z.coerce.number().int().min(0),
  skipped: z.coerce.number().int().min(0),
  failed: z.coerce.number().int().min(0),
  lastError: z.string().trim().max(500).optional(),
  waiting: z
    .array(
      z.object({
        title: z.string().max(200).default(""),
        company: z.string().max(200).default(""),
        url: z.string().max(2000).default(""),
        reason: z.string().max(40).default(""),
        message: z.string().max(500).default(""),
        since: z.coerce.number().optional(),
      })
    )
    .max(50)
    .optional(),
});

export const autoApplyControlSchema = z.object({ action: z.enum(["start", "stop"]) });
