import { describe, it, expect } from "vitest";
import { buildExtensionProfile } from "./adapter";
import type { User } from "@prisma/client";

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_1",
    email: "ada@example.com",
    emailVerified: null,
    phone: "555-0100",
    passwordHash: "hashed",
    firstName: "Ada",
    lastName: "Lovelace",
    role: "CANDIDATE",
    status: "ACTIVE",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as User;
}

function fakeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "profile_1",
    userId: "user_1",
    location: "Austin, TX",
    headline: "Backend Engineer",
    bio: "I build reliable backend systems.",
    currentTitle: "Backend Engineer",
    currentCompany: "Acme",
    totalExperienceYears: 4,
    careerLevel: "MID",
    industry: "Software",
    desiredTitles: ["Senior Backend Engineer"],
    desiredIndustries: [],
    desiredLocations: ["Austin, TX"],
    workplaceTypes: ["HYBRID"],
    employmentTypes: ["FULL_TIME"],
    desiredSalaryMin: 130000,
    desiredSalaryMax: 160000,
    salaryCurrency: "USD",
    noticePeriodDays: 14,
    workAuthorization: "US Citizen",
    sponsorshipStatus: "NOT_REQUIRED",
    willingToRelocate: false,
    targetTitles: [],
    targetCompanies: [],
    careerGoals: null,
    linkedinUrl: "https://linkedin.com/in/ada",
    githubUrl: "https://github.com/ada",
    portfolioUrl: null,
    experiences: [
      {
        title: "Backend Engineer",
        company: "Acme",
        location: "Austin, TX",
        startDate: new Date("2022-01-01"),
        endDate: null,
        isCurrent: true,
        achievements: ["Cut p99 latency by 40%"],
      },
    ],
    education: [
      { degree: "B.S. Computer Science", fieldOfStudy: "CS", school: "UT Austin", startDate: new Date("2014-08-01"), endDate: new Date("2018-05-01") },
    ],
    certifications: [{ name: "AWS Certified Developer" }],
    languages: [{ language: "English" }],
    skills: [
      { type: "TECHNICAL", level: "EXPERT", skill: { name: "Python" } },
      { type: "TECHNICAL", level: "BEGINNER", skill: { name: "Rust" } },
      { type: "SOFT", level: "ADVANCED", skill: { name: "Communication" } },
      { type: "TOOL", level: "INTERMEDIATE", skill: { name: "Docker" } },
    ],
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("buildExtensionProfile", () => {
  it("maps identity fields from the user and profile", () => {
    const result = buildExtensionProfile(fakeUser(), fakeProfile());
    expect(result.identity.firstName).toBe("Ada");
    expect(result.identity.lastName).toBe("Lovelace");
    expect(result.identity.email).toBe("ada@example.com");
    expect(result.identity.phone).toBe("555-0100");
    expect(result.identity.city).toBe("Austin");
    expect(result.identity.state).toBe("TX");
  });

  it("maps career level to the extension's seniority vocabulary", () => {
    expect(buildExtensionProfile(fakeUser(), fakeProfile({ careerLevel: "MID" })).targeting.seniority).toBe("mid");
    expect(buildExtensionProfile(fakeUser(), fakeProfile({ careerLevel: "DIRECTOR" })).targeting.seniority).toBe("director");
    expect(buildExtensionProfile(fakeUser(), fakeProfile({ careerLevel: null })).targeting.seniority).toBe("");
  });

  it("splits skills into core/familiar/tools by type and level", () => {
    const result = buildExtensionProfile(fakeUser(), fakeProfile());
    expect(result.skills.core).toEqual(["Python"]);
    expect(result.skills.familiar).toEqual(["Rust", "Communication"]);
    expect(result.skills.tools).toEqual(["Docker"]);
  });

  it("maps work experience history with ISO dates and an open end date for current roles", () => {
    const result = buildExtensionProfile(fakeUser(), fakeProfile());
    expect(result.experience.history).toHaveLength(1);
    expect(result.experience.history[0]).toMatchObject({
      title: "Backend Engineer",
      company: "Acme",
      start: "2022-01-01",
      end: "",
      bullets: ["Cut p99 latency by 40%"],
    });
  });

  it("never fabricates voluntary-disclosure or strengths data Career OS doesn't collect", () => {
    const result = buildExtensionProfile(fakeUser(), fakeProfile());
    expect(result.strengths).toEqual([]);
    expect(result.voluntary.gender).toBe("Decline to self identify");
  });

  it("falls back to empty values rather than throwing when optional fields are missing", () => {
    const result = buildExtensionProfile(
      fakeUser({ phone: null }),
      fakeProfile({ location: null, linkedinUrl: null, githubUrl: null, bio: null })
    );
    expect(result.identity.phone).toBe("");
    expect(result.identity.city).toBe("");
    expect(result.identity.linkedin).toBe("");
    expect(result.narrative.summary).toBe("");
  });
});
