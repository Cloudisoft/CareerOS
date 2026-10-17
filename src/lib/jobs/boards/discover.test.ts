import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBoard } from "./discover";
import { isRecent, locationFits, titleFit } from "./match";

const now = new Date().toISOString();

function mockFetch(byHost: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
    const body = byHost[url.hostname];
    return { ok: body !== undefined, status: body === undefined ? 404 : 200, json: async () => body } as Response;
  }));
}
afterEach(() => vi.unstubAllGlobals());

describe("employer board discovery", () => {
  it("reads Greenhouse boards and sends company-hosted postings to Greenhouse's own form", async () => {
    mockFetch({
      "boards-api.greenhouse.io": {
        jobs: [
          { id: 1, title: "QA Analyst", absolute_url: "https://careers.acme.com/jobs/1", location: { name: "Remote - US" }, content: "&lt;p&gt;Test things&lt;/p&gt;", first_published: now },
          { id: 2, title: "QA Lead", absolute_url: "https://boards.greenhouse.io/acme/jobs/2", location: { name: "Austin, TX" }, updated_at: now },
        ],
      },
    });
    const jobs = await fetchBoard("greenhouse", "acme-test-1", "Acme");
    expect(jobs[0]).toMatchObject({
      ats: "greenhouse",
      company: "Acme",
      workplaceType: "remote",
      description: "Test things",
      applyUrl: "https://job-boards.greenhouse.io/embed/job_app?for=acme-test-1&token=1",
    });
    expect(jobs[1].applyUrl).toBe("https://boards.greenhouse.io/acme/jobs/2");
  });

  it("reads Lever and Ashby boards with their application URLs", async () => {
    mockFetch({
      "api.lever.co": [{ id: "a", text: "QA Engineer", hostedUrl: "https://jobs.lever.co/acme/a", categories: { location: "Remote" }, createdAt: Date.now() }],
      "api.ashbyhq.com": { jobs: [{ id: "b", title: "QA Analyst", jobUrl: "https://jobs.ashbyhq.com/acme/b", location: "New York", isRemote: false, publishedAt: now }] },
    });
    expect((await fetchBoard("lever", "acme-test-2", "Acme"))[0]).toMatchObject({ applyUrl: "https://jobs.lever.co/acme/a/apply", workplaceType: "remote" });
    expect((await fetchBoard("ashby", "acme-test-3", "Acme"))[0]).toMatchObject({ applyUrl: "https://jobs.ashbyhq.com/acme/b/application" });
  });

  it("refuses identifiers that could change the request path", async () => {
    await expect(fetchBoard("greenhouse", "../admin", "x")).rejects.toThrow(/Invalid board/);
  });

  it("keeps postings that fit the person's titles, places and dates", () => {
    expect(titleFit("Senior QA Analyst", ["QA Analyst"])).toBeGreaterThanOrEqual(0.6);
    expect(titleFit("Product Designer", ["QA Analyst"])).toBeLessThan(0.6);
    const prefs = { workplaceTypes: ["remote"], desiredLocations: [], city: "Austin", country: "United States" };
    expect(locationFits({ location: "Remote - US", workplaceType: "remote" }, prefs)).toBe(true);
    expect(locationFits({ location: "Remote - Germany", workplaceType: "remote" }, prefs)).toBe(false);
    expect(isRecent(new Date(Date.now() - 40 * 86400000).toISOString(), 21)).toBe(false);
  });
});
