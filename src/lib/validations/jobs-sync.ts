import { z } from "zod";

export const syncExternalJobsSchema = z.object({
  queries: z.array(z.string().trim().min(1).max(120)).min(1).max(10),
  country: z.string().trim().length(2).optional(),
});
export type SyncExternalJobsInput = z.infer<typeof syncExternalJobsSchema>;
