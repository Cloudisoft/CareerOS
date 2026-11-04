import { describe, expect, it } from "vitest";
import { categoryForScore, parseAtsResponse } from "./ats";

const valid = {
  score: 82,
  breakdown: { skills: 90, experience: 80, education: 70, employment: 75, technical: 88, location: 100, salary: 70, relevance: 85 },
  summary: "Strong backend engineer with relevant fintech experience.",
  strengths: ["Go", "Postgres"],
  weaknesses: ["No Kubernetes"],
  missingSkills: ["Kubernetes"],
  recommendations: ["Phone screen"],
};

describe("categoryForScore", () => {
  it("maps score bands to categories", () => {
    expect(categoryForScore(100)).toBe("HIGHLY_QUALIFIED");
    expect(categoryForScore(85)).toBe("HIGHLY_QUALIFIED");
    expect(categoryForScore(84)).toBe("QUALIFIED");
    expect(categoryForScore(70)).toBe("QUALIFIED");
    expect(categoryForScore(69)).toBe("POTENTIAL_MATCH");
    expect(categoryForScore(50)).toBe("POTENTIAL_MATCH");
    expect(categoryForScore(49)).toBe("NOT_SUITABLE");
    expect(categoryForScore(0)).toBe("NOT_SUITABLE");
  });
});

describe("parseAtsResponse", () => {
  it("parses a valid response, including inside a code fence", () => {
    const r = parseAtsResponse("```json\n" + JSON.stringify(valid) + "\n```");
    expect(r.score).toBe(82);
    expect(r.breakdown.skills).toBe(90);
    expect(r.missingSkills).toEqual(["Kubernetes"]);
  });

  it("tolerates prose around the JSON", () => {
    expect(parseAtsResponse(`Here you go: ${JSON.stringify(valid)} hope that helps`).score).toBe(82);
  });

  it("clamps out-of-range numbers", () => {
    const r = parseAtsResponse(JSON.stringify({ ...valid, score: 140, breakdown: { ...valid.breakdown, salary: -5 } }));
    expect(r.score).toBe(100);
    expect(r.breakdown.salary).toBe(0);
  });

  it("rejects a response missing a criterion, the score or the summary — never fills in a fake value", () => {
    const rest: Record<string, number> = { ...valid.breakdown };
    delete rest.skills;
    expect(() => parseAtsResponse(JSON.stringify({ ...valid, breakdown: rest }))).toThrow();
    expect(() => parseAtsResponse(JSON.stringify({ ...valid, score: undefined }))).toThrow();
    expect(() => parseAtsResponse(JSON.stringify({ ...valid, summary: "" }))).toThrow();
    expect(() => parseAtsResponse("not json")).toThrow();
  });
});
