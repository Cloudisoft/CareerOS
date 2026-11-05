import { describe, expect, it } from "vitest";
import { MICRO1_OPPORTUNITIES_URL, aiWorkRoleSchema, applyUrlFor, skillMatch } from "./service";

describe("skillMatch", () => {
  it("counts exact and contained skill names, ignoring case", () => {
    const r = skillMatch(["Python", "Prompt evaluation", "SQL", "Tax law"], ["python", "SQL databases", "Excel"]);
    expect(r.matched).toEqual(["Python", "SQL"]);
    expect(r.score).toBe(50);
  });
  it("gives no score for a role without skills", () => {
    expect(skillMatch([], ["Python"]).score).toBe(null);
  });
  it("doesn't match on tiny fragments", () => {
    expect(skillMatch(["R"], ["Rust"]).matched).toEqual([]);
  });
});

describe("applyUrlFor", () => {
  it("prefers the role's link, then the referral link, then micro1's page", () => {
    expect(applyUrlFor({ applyUrl: "https://a.example/role" }, "https://ref.example")).toBe("https://a.example/role");
    expect(applyUrlFor({ applyUrl: null }, "https://ref.example")).toBe("https://ref.example");
    expect(applyUrlFor({ applyUrl: null }, null)).toBe(MICRO1_OPPORTUNITIES_URL);
  });
});

describe("aiWorkRoleSchema", () => {
  const base = { title: "AI Agent Evaluator", category: "AI evaluation", description: "Review and grade AI agent transcripts for accuracy." };
  it("accepts a valid role and normalises the currency", () => {
    const r = aiWorkRoleSchema.parse({ ...base, payMin: 25, payMax: 45, payCurrency: "usd", applyUrl: "" });
    expect(r.payCurrency).toBe("USD");
    expect(r.applyUrl).toBe(null);
  });
  it("rejects an upside-down pay range and non-https links", () => {
    expect(() => aiWorkRoleSchema.parse({ ...base, payMin: 50, payMax: 20 })).toThrow();
    expect(() => aiWorkRoleSchema.parse({ ...base, applyUrl: "http://micro1.ai" })).toThrow();
    expect(() => aiWorkRoleSchema.parse({ ...base, applyUrl: "javascript:alert(1)" })).toThrow();
  });
});
