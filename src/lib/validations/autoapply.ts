import { z } from "zod";

export const updateAutoApplySettingsSchema = z.object({
  minMatchScore: z.coerce.number().int().min(0).max(100),
  monthlyLimit: z.coerce.number().int().min(0).max(100000),
  pacingSeconds: z.coerce.number().int().min(10).max(600),
  concurrency: z.coerce.number().int().min(1).max(3),
  autoSubmit: z.boolean(),
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

export const extensionRunSchema = z.object({
  runId: z.string().trim().min(1).max(120),
  status: z.enum(["running", "finished"]),
  queued: z.coerce.number().int().min(0),
  submitted: z.coerce.number().int().min(0),
  assisted: z.coerce.number().int().min(0),
  skipped: z.coerce.number().int().min(0),
  failed: z.coerce.number().int().min(0),
  lastError: z.string().trim().max(500).optional(),
});
