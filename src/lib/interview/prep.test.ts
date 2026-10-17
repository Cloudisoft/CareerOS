import { describe, it, expect } from "vitest";
import { computeWeightedReadiness } from "@/lib/interview/prep";

describe("computeWeightedReadiness", () => {
  it("returns 0 for no sessions", () => {
    expect(computeWeightedReadiness([])).toBe(0);
  });

  it("returns the score itself for a single session", () => {
    expect(computeWeightedReadiness([70])).toBe(70);
  });

  it("weights the most recent (first) score more heavily than older ones", () => {
    // Newest-first: 90 just now, 50 before that — should land closer to 90 than a flat average of 70.
    const result = computeWeightedReadiness([90, 50]);
    expect(result).toBeGreaterThan(70);
    expect(result).toBeLessThanOrEqual(90);
  });

  it("climbs toward 100 as recent practice improves, even with a weak history", () => {
    const early = computeWeightedReadiness([40]);
    const later = computeWeightedReadiness([95, 80, 60, 40]);
    expect(later).toBeGreaterThan(early);
  });

  it("is always within 0-100 for in-range inputs", () => {
    const result = computeWeightedReadiness([100, 0, 50, 75, 20]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});
