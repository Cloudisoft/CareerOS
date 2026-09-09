import { z } from "zod";

export const LEARNING_PROGRESS_STATUSES = ["IN_PROGRESS", "COMPLETED"] as const;

export const updateProgressSchema = z.object({
  status: z.enum(LEARNING_PROGRESS_STATUSES),
});
