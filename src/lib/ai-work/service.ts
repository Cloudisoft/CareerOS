import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AiWorkRole } from "@prisma/client";

/**
 * Paid AI-training roles from partners (micro1), added by platform admins.
 * People apply on the partner's site and the partner pays them; Career OS
 * lists the roles, shows how well each fits, and helps them practise.
 */

export const AI_WORK_CATEGORIES = [
  "AI evaluation",
  "Engineering & data",
  "Finance & accounting",
  "Healthcare & medicine",
  "Legal & policy",
  "Languages & writing",
  "Creative & media",
  "Science & research",
  "Other expertise",
] as const;

/** micro1's public opportunities page, used when no referral link or role link is set. */
export const MICRO1_OPPORTUNITIES_URL = "https://www.micro1.ai/experts/opportunities";

const REFERRAL_KEY = "aiwork.referralUrl";

const httpsUrl = z
  .string()
  .trim()
  .max(1000)
  .url("Enter a full link starting with https://")
  .refine((u) => u.startsWith("https://"), "Use an https:// link");

export const aiWorkRoleSchema = z
  .object({
    title: z.string().trim().min(3, "Add a role title").max(160),
    category: z.enum(AI_WORK_CATEGORIES),
    description: z.string().trim().min(20, "Describe the work in a sentence or two").max(5000),
    skills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    minYears: z.number().int().min(0).max(40).nullable().optional(),
    payMin: z.number().int().min(1).max(10000).nullable().optional(),
    payMax: z.number().int().min(1).max(10000).nullable().optional(),
    payCurrency: z.string().trim().length(3).toUpperCase().default("USD"),
    applyUrl: httpsUrl.nullable().optional().or(z.literal("").transform(() => null)),
    status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
  })
  .refine((r) => r.payMin == null || r.payMax == null || r.payMax >= r.payMin, { message: "Top of the pay range must be at least the bottom", path: ["payMax"] });

export type AiWorkRoleInput = z.infer<typeof aiWorkRoleSchema>;

export async function listRoles(opts: { includeClosed?: boolean } = {}) {
  return prisma.aiWorkRole.findMany({
    where: opts.includeClosed ? {} : { status: "ACTIVE" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createRole(input: AiWorkRoleInput, createdById: string) {
  return prisma.aiWorkRole.create({ data: { ...input, skills: dedupe(input.skills), createdById } });
}

export async function updateRole(id: string, input: AiWorkRoleInput) {
  return prisma.aiWorkRole.update({ where: { id }, data: { ...input, skills: dedupe(input.skills) } });
}

export async function deleteRole(id: string) {
  await prisma.aiWorkRole.delete({ where: { id } });
}

function dedupe(skills: string[]) {
  const seen = new Set<string>();
  return skills.filter((s) => {
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** The link set in Admin → AI Work, else the MICRO1_REFERRAL_URL environment variable. */
export async function getReferralUrl(): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: REFERRAL_KEY } });
  if (row?.value) return row.value;
  const fromEnv = process.env.MICRO1_REFERRAL_URL?.trim();
  return fromEnv && httpsUrl.safeParse(fromEnv).success ? fromEnv : null;
}

export async function setReferralUrl(url: string | null) {
  if (!url) {
    await prisma.appSetting.deleteMany({ where: { key: REFERRAL_KEY } });
    return null;
  }
  const value = httpsUrl.parse(url);
  await prisma.appSetting.upsert({ where: { key: REFERRAL_KEY }, create: { key: REFERRAL_KEY, value }, update: { value } });
  return value;
}

/** Where "Apply" goes: the role's own link, else the referral link, else micro1's opportunities page. */
export function applyUrlFor(role: Pick<AiWorkRole, "applyUrl">, referralUrl: string | null) {
  return role.applyUrl || referralUrl || MICRO1_OPPORTUNITIES_URL;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

/**
 * How many of a role's skills the person already has. A skill counts when
 * the names match or one contains the other ("Python" ~ "Python scripting").
 */
export function skillMatch(roleSkills: string[], mySkills: string[]) {
  const mine = mySkills.map(norm).filter(Boolean);
  const matched = roleSkills.filter((rs) => {
    const r = norm(rs);
    return r && mine.some((m) => m === r || (m.length >= 3 && r.includes(m)) || (r.length >= 3 && m.includes(r)));
  });
  return { matched, score: roleSkills.length ? Math.round((matched.length / roleSkills.length) * 100) : null };
}

/** The interview-practice context for a role, used the same way as a target job. */
export async function roleInterviewContext(roleId: string | null | undefined) {
  if (!roleId) return null;
  const role = await prisma.aiWorkRole.findUnique({ where: { id: roleId } });
  if (!role) return null;
  return {
    id: role.id,
    context: [
      `${role.title} — paid AI-training work with ${role.partner}`,
      `Field: ${role.category}`,
      role.skills.length ? `Skills: ${role.skills.join(", ")}` : null,
      role.minYears ? `Experience: ${role.minYears}+ years` : null,
      "The real interview is a 20–40 minute AI interview that checks hands-on domain expertise: explaining concepts clearly, judging the quality of answers, and spotting errors.",
      role.description.slice(0, 1500),
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
