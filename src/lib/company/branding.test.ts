import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { candidateDomains, titleMatches } from "./branding";

describe("candidateDomains", () => {
  it("uses only the profile website when there is one", () => {
    const d = candidateDomains("CrowdStrike, Inc.", "https://www.crowdstrike.com/careers", ["https://boards.greenhouse.io/crowdstrike/jobs/1", "https://crowdstrike.wd5.myworkdayjobs.com/x"]);
    expect(d).toEqual([{ domain: "crowdstrike.com", trusted: true }]);
  });
  it("skips job-board hosts", () => {
    const d = candidateDomains("CrowdStrike", null, ["https://boards.greenhouse.io/crowdstrike/jobs/1", "https://crowdstrike.wd5.myworkdayjobs.com/x"]);
    expect(d.some((x) => x.domain.includes("greenhouse") || x.domain.includes("workday"))).toBe(false);
    expect(d[0].domain).toBe("crowdstrike.com");
  });
  it("uses a company-hosted careers page, then name guesses", () => {
    const d = candidateDomains("Replit", null, ["https://careers.replit.com/jobs/42"]);
    expect(d[0]).toEqual({ domain: "replit.com", trusted: false });
    expect(d.map((x) => x.domain)).toContain("replit.ai");
  });
  it("handles two-part country domains", () => {
    expect(candidateDomains("Acme Widgets Ltd", "https://shop.acmewidgets.co.uk", [])[0].domain).toBe("acmewidgets.co.uk");
  });
});

describe("titleMatches", () => {
  it("needs every word of the name in the site title", () => {
    expect(titleMatches("CrowdStrike, Inc.", "CrowdStrike: We Stop Breaches with AI-native Cybersecurity")).toBe(true);
    expect(titleMatches("Ledgerline Financial", "Ledgerline Financial | Modern accounting")).toBe(true);
    expect(titleMatches("Ledgerline Financial", "Ledgerline — domain for sale")).toBe(false);
    expect(titleMatches("Supabase", "Supabase | The Postgres Development Platform.")).toBe(true);
  });
  it("refuses very short names that would match anything", () => {
    expect(titleMatches("AB", "AB testing tools")).toBe(false);
  });
});

describe("directory names", () => {
  it("drops legal endings and trademark signs for searching", async () => {
    const { searchName } = await import("./branding");
    expect(searchName("SHD Composite Materials Inc")).toBe("SHD Composite Materials");
    expect(searchName("Plus500™")).toBe("Plus500");
    expect(searchName("CrowdStrike, Inc.")).toBe("CrowdStrike");
    expect(searchName("Johnson & Johnson")).toBe("Johnson & Johnson");
  });
  it("finds the brand inside a subsidiary's name, only by removing generic words", async () => {
    const { brandName } = await import("./branding");
    expect(brandName("Amazon.com Services LLC")).toBe("amazon");
    expect(brandName("Regal Rexnord")).toBeNull();
    expect(brandName("US Services")).toBeNull();
  });
});
