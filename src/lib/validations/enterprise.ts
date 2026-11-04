import { z } from "zod";

export const boostSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("POST"), postId: z.string().min(1) }),
  z.object({ kind: z.literal("CAMPAIGN"), name: z.string().trim().min(1).max(80), jobIds: z.array(z.string().min(1)).min(1).max(10) }),
]);

export const careersListingSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(20000),
  applyUrl: z.string().trim().min(8).max(2000),
  published: z.boolean().optional(),
});
