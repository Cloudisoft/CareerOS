import { z } from "zod";

export const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;

export const updateUserStatusSchema = z.object({
  status: z.enum(ACCOUNT_STATUSES),
});
