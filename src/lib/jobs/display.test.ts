import { describe, expect, it } from "vitest";
import { payLabel } from "./display";

describe("payLabel", () => {
  it("formats ranges in the posting's currency", () => {
    expect(payLabel(60000, 70000, "USD")).toBe("$60–70K/yr");
    expect(payLabel(900000, 1200000, "INR")).toBe("₹900K–1.2M/yr");
    expect(payLabel(45000, 55000, "GBP")).toBe("£45–55K/yr");
    expect(payLabel(25, 40, "AUD")).toBe("A$25–40/hr");
    expect(payLabel(null, null, "USD")).toBe(null);
  });
});
