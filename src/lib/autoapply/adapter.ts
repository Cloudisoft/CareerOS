import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, SponsorshipStatus, User, WorkplaceType } from "@prisma/client";
import type { z } from "zod";
import type { extensionProfileSchema } from "@/lib/validations/autoapply";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";

/**
 * Maps a Career Profile onto the Chrome extension's flat `Profile` schema
 * (see extension/lib/profile.js EMPTY_PROFILE) so `/api/extension/sync` can
 * hand back something the content scripts can fill forms from directly.
 * Every field here comes from real, already-collected profile data — fields
 * Career OS doesn't collect (voluntary disclosures, strengths) are left at
 * the extension's own defaults rather than invented.
 */

const SENIORITY_BY_LEVEL: Record<string, string> = {
  ENTRY: "junior",
  ASSOCIATE: "junior",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
  MANAGER: "lead",
  DIRECTOR: "director",
  EXECUTIVE: "director",
};

function splitLocation(location: string | null) {
  if (!location) return { city: "", state: "", country: "" };
  const parts = location.split(",").map((p) => p.trim());
  return { city: parts[0] ?? "", state: parts[1] ?? "", country: parts[2] ?? "" };
}

function dateOnly(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

type ProfileForExtension = Awaited<ReturnType<typeof getProfileForExtensionSync>>;

export async function getProfileForExtensionSync(profileId: string) {
  return prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      experiences: { orderBy: { startDate: "desc" } },
      education: { orderBy: { startDate: "desc" } },
      certifications: true,
      languages: true,
      skills: { include: { skill: true } },
    },
  });
}

export function buildExtensionProfile(user: User, profile: ProfileForExtension) {
  const { city, state, country } = splitLocation(profile.location);

  const technicalSkills = profile.skills.filter((s) => s.type === "TECHNICAL");
  const core = technicalSkills.filter((s) => s.level === "ADVANCED" || s.level === "EXPERT").map((s) => s.skill.name);
  const familiar = [
    ...technicalSkills.filter((s) => s.level === "BEGINNER" || s.level === "INTERMEDIATE").map((s) => s.skill.name),
    ...profile.skills.filter((s) => s.type === "SOFT").map((s) => s.skill.name),
  ];
  const tools = profile.skills.filter((s) => s.type === "TOOL").map((s) => s.skill.name);

  return {
    identity: {
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: "",
      email: user.email,
      phone: user.phone ?? "",
      city,
      state,
      country,
      postalCode: "",
      addressLine1: "",
      linkedin: profile.linkedinUrl ?? "",
      github: profile.githubUrl ?? "",
      portfolio: profile.portfolioUrl ?? "",
    },
    targeting: {
      titles: profile.desiredTitles,
      excludeTitles: [],
      excludeCompanies: [],
      seniority: profile.careerLevel ? SENIORITY_BY_LEVEL[profile.careerLevel] ?? "" : "",
      workModes: profile.workplaceTypes.map((t) => t.toLowerCase()),
      locations: profile.desiredLocations,
      minSalary: profile.desiredSalaryMin ?? 0,
      salaryCurrency: profile.salaryCurrency,
      salaryPeriod: "year",
    },
    experience: {
      totalYears: profile.totalExperienceYears ?? 0,
      currentTitle: profile.currentTitle ?? "",
      currentCompany: profile.currentCompany ?? "",
      noticePeriod: profile.noticePeriodDays ? `${profile.noticePeriodDays} days` : "",
      history: profile.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        start: dateOnly(e.startDate),
        end: e.isCurrent ? "" : dateOnly(e.endDate),
        location: e.location ?? "",
        bullets: e.achievements,
      })),
    },
    skills: {
      core,
      familiar,
      tools,
      languages: profile.languages.map((l) => l.language),
    },
    education: profile.education.map((e) => ({
      degree: e.degree ?? "",
      field: e.fieldOfStudy ?? "",
      school: e.school,
      year: e.endDate ? e.endDate.getFullYear() : e.startDate ? e.startDate.getFullYear() : "",
      gpa: "",
    })),
    certifications: profile.certifications.map((c) => c.name),
    strengths: [],
    workAuth: {
      authorizedIn: (profile.workAuthorization ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      needsSponsorship: profile.sponsorshipStatus === "REQUIRED",
      requiresVisa: profile.sponsorshipStatus === "MAY_REQUIRE_FUTURE" ? "possible" : "",
      willingToRelocate: profile.willingToRelocate,
    },
    voluntary: {
      gender: "Decline to self identify",
      race: "Decline to self identify",
      veteran: "I don't wish to answer",
      disability: "I don't wish to answer",
    },
    narrative: {
      summary: profile.bio ?? "",
      whyLeaving: "",
      availableFrom: "",
    },
  };
}

type ExtensionProfileEdits = z.infer<typeof extensionProfileSchema>;

const WORKPLACE_BY_MODE: Record<string, WorkplaceType> = {
  remote: "REMOTE",
  hybrid: "HYBRID",
  onsite: "ONSITE",
  "on-site": "ONSITE",
  "on site": "ONSITE",
  office: "ONSITE",
};

/** "30 days", "2 weeks", "1 month", "Immediately" → days; null when it can't be read. */
export function noticePeriodToDays(value: string): number | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (/^(immediate(ly)?|now|none|0)$/.test(v)) return 0;
  const m = /^(\d+(?:\.\d+)?)\s*(d|day|days|w|wk|week|weeks|m|mo|month|months)?$/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2] ?? "days";
  if (unit.startsWith("w")) return Math.round(n * 7);
  if (unit.startsWith("m")) return Math.round(n * 30);
  return Math.round(n);
}

/**
 * Writes back what the person edited in the extension's options page, so the Career Profile and the
 * extension stay the same profile. Only fields with a home in the Career Profile are accepted (see
 * extensionProfileSchema); everything else the extension keeps for itself.
 */
export async function saveExtensionProfileEdits(userId: string, profileId: string, edits: ExtensionProfileEdits) {
  const current = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: { location: true, sponsorshipStatus: true },
  });
  const data: Prisma.CandidateProfileUpdateInput = {};
  const userData: Prisma.UserUpdateInput = {};
  const { identity, targeting, experience, workAuth, narrative } = edits;

  if (identity) {
    if (identity.firstName) userData.firstName = identity.firstName;
    if (identity.lastName) userData.lastName = identity.lastName;
    if (identity.phone !== undefined) userData.phone = identity.phone || null;
    if (identity.city !== undefined || identity.state !== undefined || identity.country !== undefined) {
      const was = splitLocation(current.location);
      const parts = [identity.city ?? was.city, identity.state ?? was.state, identity.country ?? was.country];
      while (parts.length && !parts[parts.length - 1]) parts.pop();
      data.location = parts.length ? parts.join(", ") : null;
    }
    if (identity.linkedin !== undefined) data.linkedinUrl = identity.linkedin || null;
    if (identity.github !== undefined) data.githubUrl = identity.github || null;
    if (identity.portfolio !== undefined) data.portfolioUrl = identity.portfolio || null;
  }
  if (targeting) {
    if (targeting.titles) data.desiredTitles = targeting.titles.filter(Boolean);
    if (targeting.locations) data.desiredLocations = targeting.locations.filter(Boolean);
    if (targeting.workModes) {
      data.workplaceTypes = Array.from(
        new Set(targeting.workModes.map((m) => WORKPLACE_BY_MODE[m.toLowerCase()]).filter(Boolean))
      );
    }
    if (targeting.minSalary !== undefined) data.desiredSalaryMin = targeting.minSalary || null;
    if (targeting.salaryCurrency) data.salaryCurrency = targeting.salaryCurrency.toUpperCase();
  }
  if (experience) {
    if (experience.currentTitle !== undefined) data.currentTitle = experience.currentTitle || null;
    if (experience.currentCompany !== undefined) data.currentCompany = experience.currentCompany || null;
    if (experience.totalYears !== undefined) data.totalExperienceYears = experience.totalYears;
    if (experience.noticePeriod !== undefined) {
      const days = noticePeriodToDays(experience.noticePeriod);
      if (days !== null || !experience.noticePeriod) data.noticePeriodDays = days;
    }
  }
  if (workAuth) {
    if (workAuth.authorizedIn) data.workAuthorization = workAuth.authorizedIn.filter(Boolean).join(", ") || null;
    if (workAuth.needsSponsorship !== undefined) {
      const next: SponsorshipStatus = workAuth.needsSponsorship
        ? "REQUIRED"
        : current.sponsorshipStatus === "MAY_REQUIRE_FUTURE"
          ? "MAY_REQUIRE_FUTURE"
          : "NOT_REQUIRED";
      data.sponsorshipStatus = next;
    }
    if (workAuth.willingToRelocate !== undefined) data.willingToRelocate = workAuth.willingToRelocate;
  }
  if (narrative?.summary !== undefined) data.bio = narrative.summary || null;

  await prisma.$transaction([
    prisma.candidateProfile.update({ where: { id: profileId }, data }),
    ...(Object.keys(userData).length ? [prisma.user.update({ where: { id: userId }, data: userData })] : []),
  ]);
  await recomputeCareerReadiness(profileId);
}
