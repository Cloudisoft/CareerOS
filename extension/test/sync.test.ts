import { describe, expect, it } from "vitest";
import { page } from "./load";

const { CareerOS } = page("", ["lib/sync.js", "lib/policy.js"]);
const { Sync, Policy } = CareerOS;

describe("two-way sync with the website", () => {
  const base = { identity: { phone: "111", city: "Austin" }, targeting: { titles: ["QA"] }, experience: { history: [{ title: "A" }] } };

  it("takes the website's profile on the first sync", () => {
    const local = { identity: { phone: "999", city: "" } };
    const out = Sync.mergeProfile(local, base, null);
    expect(out.identity.phone).toBe("111");
    expect(out.identity.city).toBe("Austin");
    expect(Sync.profileChanges(out, null)).toBeNull();
  });

  it("keeps a change made in the extension and sends it up", () => {
    const local = { identity: { phone: "222", city: "Austin" }, targeting: { titles: ["QA", "SDET"] }, experience: { history: [{ title: "B" }] } };
    const out = Sync.mergeProfile(local, base, base);
    expect(out.identity.phone).toBe("222");
    expect(out.targeting.titles).toEqual(["QA", "SDET"]);
    expect(out.experience.history).toEqual([{ title: "B" }]); // kept here even though it isn't sent
    expect(Sync.profileChanges(out, base)).toEqual({ identity: { phone: "222" }, targeting: { titles: ["QA", "SDET"] } });
  });

  it("brings down a change made on the website, including a cleared field", () => {
    const local = { identity: { phone: "111", city: "Austin" }, targeting: { titles: ["QA"] } };
    const server = { identity: { phone: "333", city: "" }, targeting: { titles: ["QA"] } };
    const out = Sync.mergeProfile(local, server, base);
    expect(out.identity.phone).toBe("333");
    expect(out.identity.city).toBe("");
    expect(Sync.profileChanges(out, server)).toBeNull();
  });

  it("never lets the website's self-identification defaults replace the person's choice", () => {
    const out = Sync.mergeProfile({ voluntary: { veteran: "No" } }, { voluntary: { veteran: "I don't wish to answer" } }, null);
    expect(out.voluntary.veteran).toBe("No");
  });

  it("merges run settings the same way", () => {
    const server = { minMatchScore: 70, pacingSeconds: 45, concurrency: 1, autoSubmit: false, platformModes: {} };
    expect(Sync.mergeSettings({ concurrency: 3 }, server, null).concurrency).toBe(1);
    const local = { minMatchScore: 70, pacingSeconds: 45, concurrency: 2, autoSubmit: true, platformModes: { lever: "assist" } };
    const merged = Sync.mergeSettings(local, server, server);
    expect(merged).toMatchObject({ concurrency: 2, autoSubmit: true, platformModes: { lever: "assist" } });
    expect(Sync.settingsChanges(Object.assign({}, local, merged), server)).toEqual({ concurrency: 2, autoSubmit: true, platformModes: { lever: "assist" } });
    const fromWeb = Object.assign({}, server, { minMatchScore: 80 });
    expect(Sync.mergeSettings(Object.assign({}, server), fromWeb, server).minMatchScore).toBe(80);
  });

  it("records what the server now holds after a push", () => {
    expect(Sync.applyToBase(base, { identity: { phone: "222" } }).identity).toEqual({ phone: "222", city: "Austin" });
  });
});

describe("restricted job boards", () => {
  it("only applies on its own on LinkedIn after the acknowledgment", () => {
    const settings = { autoSubmit: true, platformModes: { linkedin: "auto" }, acknowledgedRestricted: false };
    expect(Policy.for("linkedin", settings).mode).toBe("assist");
    expect(Policy.canAutoSubmit("linkedin", settings).allowed).toBe(false);
    expect(Policy.canAutoSubmit("linkedin", { ...settings, acknowledgedRestricted: true }).allowed).toBe(true);
    expect(Policy.for("lever", { platformModes: { lever: "assist" } }).mode).toBe("assist");
  });
});
