import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

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
      authorizedIn: profile.workAuthorization ? [profile.workAuthorization] : [],
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
