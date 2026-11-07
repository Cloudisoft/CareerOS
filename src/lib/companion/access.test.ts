import { describe, it, expect } from "vitest";
import { companionAccess } from "./access";

describe("CareerOS desktop installer gate", () => {
  it("requires login for anonymous visitors", () => expect(companionAccess(null, false)).toBe("login"));
  it("rejects employers even with Interview AI", () => expect(companionAccess("EMPLOYER", true)).toBe("candidate-only"));
  it("rejects company admins", () => expect(companionAccess("COMPANY_ADMIN", true)).toBe("candidate-only"));
  it("rejects platform admins", () => expect(companionAccess("PLATFORM_ADMIN", true)).toBe("candidate-only"));
  it("prompts candidates without Interview AI to subscribe", () => expect(companionAccess("CANDIDATE", false)).toBe("subscribe"));
  it("allows candidates with active Interview AI", () => expect(companionAccess("CANDIDATE", true)).toBe("allowed"));
});
