import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

/** Mirrors one ADAPTERS entry in extension/lib/ats.js — every field optional
 * since an override only ever patches the fields that broke, never replaces
 * the whole adapter. */
export const selectorOverrideEntrySchema = z
  .object({
    form: z.string().min(1).max(2000).optional(),
    submit: z.string().min(1).max(2000).optional(),
    title: z.string().min(1).max(2000).optional(),
    company: z.string().min(1).max(2000).optional(),
    description: z.string().min(1).max(2000).optional(),
  })
  .strict();

export const selectorOverridesSchema = z.record(z.string().min(1).max(60), selectorOverrideEntrySchema);

export type SelectorOverrides = z.infer<typeof selectorOverridesSchema>;

export async function getSelectorOverrides(): Promise<{ overrides: SelectorOverrides; updatedAt: Date | null }> {
  const row = await prisma.extensionSelectorOverride.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return { overrides: {}, updatedAt: null };
  return { overrides: (row.overrides as SelectorOverrides) ?? {}, updatedAt: row.updatedAt };
}

export async function setSelectorOverrides(overrides: SelectorOverrides, updatedBy?: string) {
  const row = await prisma.extensionSelectorOverride.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, overrides, updatedBy },
    update: { overrides, updatedBy },
  });
  return row;
}
