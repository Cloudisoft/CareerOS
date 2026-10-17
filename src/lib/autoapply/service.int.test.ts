/**
 * Auto Apply bookkeeping against a real database. Runs only when TEST_DATABASE_URL points at a migrated,
 * disposable Postgres (it creates and deletes its own rows):
 *   TEST_DATABASE_URL=postgresql://… npx prisma migrate deploy && TEST_DATABASE_URL=… pnpm test
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("auto apply records (database)", async () => {
  const { prisma } = await import("@/lib/prisma");
  const service = await import("@/lib/autoapply/service");
  const answers = await import("@/lib/autoapply/answers");
  let profileId = "";
  const email = `autoapply-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: "x", firstName: "Ada", lastName: "Lovelace" } });
    profileId = (await prisma.candidateProfile.create({ data: { userId: user.id } })).id;
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  const base = { title: "QA Analyst", company: "Northwind Test Co", ats: "greenhouse", matchScore: 80 };

  it("records a filled-but-unsent form as SAVED: not counted, not treated as applied", async () => {
    const a = await service.logExtensionApplication(profileId, { ...base, url: "https://boards.greenhouse.io/nw/jobs/1?gh_src=x", outcome: "assisted" });
    expect(a.status).toBe("SAVED");
    expect(await service.countAppliedThisMonth(profileId)).toBe(0);
    expect(await service.listAppliedUrls(profileId)).toEqual([]);
  });

  it("a later real submission of the same posting (another tracking link) becomes APPLIED, counted once", async () => {
    const a = await service.logExtensionApplication(profileId, { ...base, url: "https://boards.greenhouse.io/nw/jobs/1?utm_source=linkedin", outcome: "submitted" });
    expect(a.status).toBe("APPLIED");
    expect(Date.now() - a.appliedAt.getTime()).toBeLessThan(60_000);
    expect(await service.countAppliedThisMonth(profileId)).toBe(1);
    expect(await service.listAppliedUrls(profileId)).toEqual(["https://boards.greenhouse.io/nw/jobs/1"]);
    // Filling it again afterwards never downgrades a sent application.
    const again = await service.logExtensionApplication(profileId, { ...base, url: "https://boards.greenhouse.io/nw/jobs/1", outcome: "assisted" });
    expect(again.status).toBe("APPLIED");
    expect(await prisma.application.count({ where: { profileId } })).toBe(1);
  });

  it("remembers the person's answers and replaces them when they answer again", async () => {
    await answers.saveAnswers(profileId, [
      { question: "Which ticketing tools have you used? *", answer: "Zendesk" },
      { question: "Protected veteran status", answer: "No", key: "eeo:veteran" },
    ]);
    await answers.saveAnswers(profileId, [{ question: "Which ticketing tools have you used?", answer: "Zendesk and Jira" }]);
    const list = await answers.listAnswers(profileId);
    expect(list.map((a) => [a.questionKey, a.answer]).sort()).toEqual([
      ["eeo:veteran", "No"],
      ["which ticketing tools have you used", "Zendesk and Jira"],
    ]);
  });

  it("hands a Start/Stop command to exactly one browser, and drops stale ones", async () => {
    await service.requestRunCommand(profileId, "start");
    const [a, b] = await Promise.all([service.takeRunCommand(profileId), service.takeRunCommand(profileId)]);
    expect([a, b].filter(Boolean)).toEqual(["start"]);
    expect(await service.takeRunCommand(profileId)).toBeNull();
    await service.requestRunCommand(profileId, "stop");
    await prisma.autoApplySettings.update({ where: { profileId }, data: { runCommandAt: new Date(Date.now() - 60 * 60 * 1000) } });
    expect(await service.takeRunCommand(profileId)).toBeNull();
  });

  it("stores what's waiting for the person with the run", async () => {
    const ents = { campaignMonthlyLimit: 100 } as Parameters<typeof service.recordRunHeartbeat>[2];
    const waiting = [{ title: "QA Analyst", company: "Acme", url: "https://x.test/1", reason: "captcha", message: "Tick the box" }];
    const run = await service.recordRunHeartbeat(profileId, { runId: `run_w_${Date.now()}`, status: "running", queued: 0, submitted: 0, assisted: 0, skipped: 0, failed: 0, waiting }, ents);
    expect(run.waiting).toEqual(waiting);
  });

  it("gives a connect token to only one poll, and shows the matching code", async () => {
    const ext = await import("@/lib/extension/service");
    const state = `state-${Date.now()}-abcdefghijklmnop`;
    await ext.startConnectRequest(state, "Chrome on Windows", "2.5.0");
    const info = await ext.describeConnectRequest(state);
    expect(info).toMatchObject({ label: "Chrome on Windows", version: "2.5.0", valid: true, code: ext.connectCode(state) });
    expect(info!.code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await ext.approveConnectRequest(state, user);
    const polls = await Promise.all([ext.pollConnectRequest(state), ext.pollConnectRequest(state)]);
    const tokens = polls.map((p) => ("token" in p ? p.token : undefined)).filter(Boolean) as string[];
    expect(tokens.length).toBe(1);
    await ext.revokeExtensionToken(tokens[0]);
    expect(await prisma.extensionSession.count({ where: { userId: user.id } })).toBe(0);
  });

  it("never lets one account update another account's run", async () => {
    const ents = { campaignMonthlyLimit: 100 } as Parameters<typeof service.recordRunHeartbeat>[2];
    const hb = { runId: `run_${Date.now()}`, status: "running" as const, queued: 1, submitted: 0, assisted: 0, skipped: 0, failed: 0 };
    await service.recordRunHeartbeat(profileId, hb, ents);
    const other = await prisma.user.create({ data: { email: `other-${email}`, passwordHash: "x", firstName: "B", lastName: "C" } });
    const otherProfile = await prisma.candidateProfile.create({ data: { userId: other.id } });
    await expect(service.recordRunHeartbeat(otherProfile.id, hb, ents)).rejects.toThrow(/Unknown run/);
    await prisma.user.delete({ where: { id: other.id } });
  });
});
