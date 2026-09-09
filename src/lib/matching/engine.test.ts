import { describe, it, expect } from "vitest";
import { computeMatch, type MatchProfileInput, type MatchJobInput } from "./engine";

function profile(overrides: Partial<MatchProfileInput> = {}): MatchProfileInput {
  return {
    currentTitle: "Backend Engineer",
    desiredTitles: ["Backend Engineer", "Software Engineer"],
    targetTitles: [],
    totalExperienceYears: 5,
    careerLevel: "SENIOR",
    workplaceTypes: ["REMOTE"],
    desiredLocations: ["Austin, TX"],
    desiredSalaryMin: 130000,
    desiredSalaryMax: 170000,
    skillNames: ["Python", "SQL", "AWS"],
    ...overrides,
  };
}

function job(overrides: Partial<MatchJobInput> = {}): MatchJobInput {
  return {
    title: "Senior Backend Engineer",
    location: "Austin, TX",
    workplaceType: "REMOTE",
    careerLevel: "SENIOR",
    salaryMin: 140000,
    salaryMax: 180000,
    requiredSkillNames: ["Python", "SQL", "AWS"],
    allSkillNames: ["Python", "SQL", "AWS", "Docker"],
    ...overrides,
  };
}

describe("computeMatch", () => {
  it("scores a strong all-around match highly", () => {
    const result = computeMatch(profile(), job());
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.skillsScore).toBe(100);
    expect(result.matchedSkills).toEqual(["python", "sql", "aws"]);
    expect(result.missingSkills).toHaveLength(0);
  });

  it("penalizes a candidate missing most required skills", () => {
    const result = computeMatch(profile({ skillNames: ["Java"] }), job());
    expect(result.skillsScore).toBe(0);
    expect(result.missingSkills).toEqual(["python", "sql", "aws"]);
    expect(result.score).toBeLessThan(computeMatch(profile(), job()).score);
  });

  it("treats a job with no listed skills as neutral rather than unscoreable", () => {
    const result = computeMatch(profile(), job({ requiredSkillNames: [], allSkillNames: [] }));
    expect(result.skillsScore).toBe(70);
  });

  it("rewards experience within the expected range for the job's level and penalizes far outside it", () => {
    const withinRange = computeMatch(profile({ totalExperienceYears: 6, careerLevel: "SENIOR" }), job());
    const wayUnderqualified = computeMatch(profile({ totalExperienceYears: 0, careerLevel: "ENTRY" }), job());
    expect(withinRange.experienceScore).toBe(100);
    expect(wayUnderqualified.experienceScore).toBeLessThan(withinRange.experienceScore);
  });

  it("scores remote-friendly candidates well against a remote job even without a location match", () => {
    const result = computeMatch(
      profile({ workplaceTypes: ["REMOTE"], desiredLocations: [] }),
      job({ workplaceType: "REMOTE", location: null })
    );
    expect(result.locationScore).toBe(100);
  });

  it("scores salary as a full match when ranges overlap, and decays as they diverge", () => {
    const overlapping = computeMatch(profile({ desiredSalaryMin: 100000, desiredSalaryMax: 150000 }), job({ salaryMin: 140000, salaryMax: 180000 }));
    const disjoint = computeMatch(profile({ desiredSalaryMin: 200000, desiredSalaryMax: 250000 }), job({ salaryMin: 60000, salaryMax: 80000 }));
    expect(overlapping.salaryScore).toBe(100);
    expect(disjoint.salaryScore).toBeLessThan(overlapping.salaryScore);
  });

  it("stays neutral on salary when neither side specifies a range", () => {
    const result = computeMatch(
      profile({ desiredSalaryMin: null, desiredSalaryMax: null }),
      job({ salaryMin: null, salaryMax: null })
    );
    expect(result.salaryScore).toBe(70);
  });

  it("produces human-readable reasons and gaps consistent with the sub-scores", () => {
    const result = computeMatch(profile({ skillNames: [] }), job());
    expect(result.gaps.some((g) => g.toLowerCase().includes("missing"))).toBe(true);
  });

  it("keeps the overall score within 0-100 for any input", () => {
    const extreme = computeMatch(
      profile({ totalExperienceYears: 40, careerLevel: "ENTRY", desiredSalaryMin: 500000 }),
      job({ careerLevel: "EXECUTIVE", salaryMin: 40000, salaryMax: 45000 })
    );
    expect(extreme.score).toBeGreaterThanOrEqual(0);
    expect(extreme.score).toBeLessThanOrEqual(100);
  });
});
