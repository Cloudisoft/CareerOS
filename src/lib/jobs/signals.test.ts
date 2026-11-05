import { describe, expect, it } from "vitest";
import { citizensOnly, closingInDays, requiredYears, requiresWorkAuthorization, studentFriendly, visaSignal, workAuthorizationRegions } from "./signals";

describe("visaSignal", () => {
  it("reads an offer of sponsorship", () => {
    expect(visaSignal("We offer H-1B visa sponsorship for this role.")).toBe("SPONSORS");
    expect(visaSignal("Open to candidates with OPT/CPT.")).toBe("SPONSORS");
  });
  it("lets an explicit refusal win over a mention", () => {
    expect(visaSignal("Please note: no visa sponsorship is available.")).toBe("NO_SPONSORSHIP");
    expect(visaSignal("We are unable to sponsor work visas at this time.")).toBe("NO_SPONSORSHIP");
    expect(visaSignal("We won’t sponsor.")).toBe("NO_SPONSORSHIP");
  });
  it("says not stated when the posting is silent", () => {
    expect(visaSignal("Build great products with us.")).toBe("NOT_STATED");
    expect(visaSignal(null)).toBe("NOT_STATED");
  });
});

describe("global work rights", () => {
  it("reads sponsorship wording outside the US", () => {
    expect(visaSignal("We can provide a Certificate of Sponsorship under the Skilled Worker visa.")).toBe("SPONSORS");
    expect(visaSignal("Subclass 482 sponsorship available for the right candidate.")).toBe("SPONSORS");
    expect(visaSignal("LMIA support offered.")).toBe("SPONSORS");
    expect(visaSignal("Employment visa provided, plus housing allowance.")).toBe("SPONSORS");
  });
  it("names the country whose work rights are required", () => {
    expect(workAuthorizationRegions("You must have the right to work in the UK.")).toEqual(["UK"]);
    expect(workAuthorizationRegions("Full working rights in Australia required.")).toEqual(["AU"]);
    expect(workAuthorizationRegions("Open to anyone, anywhere.")).toEqual([]);
  });
  it("spots citizens-only roles and student-friendly roles", () => {
    expect(citizensOnly("Active security clearance required.")).toBe(true);
    expect(citizensOnly("All work authorizations welcome.")).toBe(false);
    expect(studentFriendly("Open to F-1 students on OPT or CPT.")).toBe(true);
    expect(studentFriendly("Optimize our pipelines.")).toBe(false);
  });
});

describe("requiresWorkAuthorization", () => {
  it("spots authorization wording", () => {
    expect(requiresWorkAuthorization("Must be legally authorized to work in the United States.")).toBe(true);
    expect(requiresWorkAuthorization("Remote friendly team.")).toBe(false);
  });
});

describe("requiredYears", () => {
  it("takes the lowest required floor", () => {
    expect(requiredYears("You have 5+ years of experience in backend systems. 2+ years leading teams experience.")).toBe(2);
    expect(requiredYears("Minimum of three (3) years of professional experience required.")).toBe(3);
    expect(requiredYears("3-5 years of relevant experience.")).toBe(3);
  });
  it("ignores preferred figures and non-experience years", () => {
    expect(requiredYears("8 years of experience preferred. A 4-year degree is required.")).toBe(null);
  });
  it("returns 0 for entry-level postings", () => {
    expect(requiredYears("This is an entry-level role; no experience required.")).toBe(0);
  });
  it("returns null when nothing is stated", () => {
    expect(requiredYears("Join our team.")).toBe(null);
  });
});

describe("closingInDays", () => {
  const now = Date.parse("2026-11-05T00:00:00Z");
  it("counts days within two weeks", () => {
    expect(closingInDays("2026-11-08T00:00:00Z", now)).toBe(3);
    expect(closingInDays("2026-12-30T00:00:00Z", now)).toBe(null);
    expect(closingInDays(null, now)).toBe(null);
  });
});
