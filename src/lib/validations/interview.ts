import { z } from "zod";

export const INTERVIEW_TYPES = ["BEHAVIORAL", "TECHNICAL", "MIXED"] as const;

export const startInterviewSchema = z.object({
  type: z.enum(INTERVIEW_TYPES).default("MIXED"),
  jobId: z.string().trim().optional().or(z.literal("")),
});

export const submitAnswerSchema = z.object({
  answer: z.string().trim().min(1, "Write an answer before submitting.").max(4000),
});
