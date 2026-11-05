import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { addMonths } from "./plans";

describe("addMonths", () => {
  it("adds whole months", () => {
    expect(addMonths(new Date("2026-11-05T10:00:00Z"), 1).toISOString()).toBe("2026-12-05T10:00:00.000Z");
    expect(addMonths(new Date("2026-11-05T10:00:00Z"), 3).toISOString()).toBe("2027-02-05T10:00:00.000Z");
    expect(addMonths(new Date("2026-11-05T10:00:00Z"), 12).toISOString()).toBe("2027-11-05T10:00:00.000Z");
  });
  it("lands on the last day of a shorter month", () => {
    expect(addMonths(new Date("2027-01-31T00:00:00Z"), 1).toISOString()).toBe("2027-02-28T00:00:00.000Z");
    expect(addMonths(new Date("2026-08-31T00:00:00Z"), 6).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});
