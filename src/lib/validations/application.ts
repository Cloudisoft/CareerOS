import { z } from "zod";

export const createApplicationSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().min(1).optional(),
  coverLetter: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const withdrawApplicationSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
