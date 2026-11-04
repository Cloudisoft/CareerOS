import { describe, expect, it } from "vitest";
import { validateApplyUrl } from "./service";

describe("validateApplyUrl", () => {
  it("accepts http(s) job links", () => {
    expect(validateApplyUrl("https://jobs.example.com/apply?id=1")).toBe("https://jobs.example.com/apply?id=1");
    expect(validateApplyUrl("  http://example.org/job ")).toBe("http://example.org/job");
  });
  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://example.com/x", "https://user:pass@example.com", "https://localhost/x", "not a url", ""])(
    "rejects %s",
    (url) => {
      expect(() => validateApplyUrl(url)).toThrow();
    }
  );
});
