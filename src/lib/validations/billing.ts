import { z } from "zod";

export const paypalConfirmSchema = z.object({
  subscriptionID: z.string().trim().min(1),
  kind: z.enum(["plan", "addon"]),
  key: z.string().trim().min(1),
});

export const cancelSchema = z.object({
  target: z.enum(["plan", "RESUME_STUDIO", "INTERVIEW_AI"]),
});
