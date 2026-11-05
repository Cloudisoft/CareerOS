// Captures real Career OS screens (local server, demo data) for the tutorial videos.
const { chromium } = require("playwright");
const B = "http://localhost:3100"; const OUT = __dirname + "/shots";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.request.post(`${B}/api/auth/login`, { data: { email: "maya@demo.local", password: "Passw0rd!e2e" } });
  const p = await ctx.newPage();
  const shot = async (name, url, prep) => {
    if (url) await p.goto(B + url, { waitUntil: "networkidle" }).catch(() => {});
    if (prep) await prep();
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 88 });
    console.log("ok", name);
  };
  const safe = async (fn) => { try { await fn(); } catch (e) { console.log("skip:", e.message.split("\n")[0]); } };
  await safe(() => shot("dashboard", "/dashboard"));
  await safe(() => shot("jobs", "/jobs?q=analyst", () => p.getByRole("heading", { name: "At a glance" }).waitFor()));
  await safe(() => shot("jobs-uk", "/jobs?country=UK&q=backend", async () => { await p.getByRole("button", { name: /Senior Backend Engineer/ }).click(); await p.getByRole("heading", { name: "Senior Backend Engineer" }).waitFor(); await p.locator("section[aria-label='Job details']").evaluate((el) => el.scrollTo(0, 380)); }));
  await safe(() => shot("jobs-filters", "/jobs", async () => { await p.getByRole("heading", { name: "At a glance" }).waitFor(); await p.getByRole("button", { name: /Filters/ }).click(); await p.getByText("Hide citizens / PR-only roles").waitFor(); }));
  await safe(() => shot("jobs-location", "/jobs", async () => { await p.getByRole("heading", { name: "At a glance" }).waitFor(); await p.getByRole("button", { name: /Location/ }).click(); await p.getByRole("button", { name: "Australia" }).waitFor(); }));
  await safe(() => shot("resume-studio", "/resume-studio"));
  await safe(async () => { await p.goto(B + "/resume-studio", { waitUntil: "networkidle" }); const link = p.getByRole("link", { name: /Maya Patel/ }).first(); if (await link.count()) { await link.click(); await p.waitForLoadState("networkidle"); } await shot("resume-editor", null); });
  await safe(() => shot("ats", "/ats-scanner"));
  await safe(() => shot("auto-apply", "/auto-apply"));
  await safe(() => shot("interview", "/interview-ai"));
  await safe(() => shot("job-gpt", "/job-gpt"));
  await safe(() => shot("applications", "/applications"));
  await safe(() => shot("ai-work", "/ai-work"));
  await safe(() => shot("profile", "/profile"));
  await safe(() => shot("learning", "/learning"));
  await safe(() => shot("company", "/company/northwind-analytics"));
  await safe(() => shot("cover-letter", "/cover-letter-studio"));
  const anon = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await anon.goto(B + "/"); await anon.waitForTimeout(1200); await anon.screenshot({ path: `${OUT}/landing.jpg`, type: "jpeg", quality: 88 }); console.log("ok landing");
  await anon.goto(B + "/login?from=search&next=%2Fjobs%3Fq%3Ddata%2Banalyst"); await anon.waitForTimeout(800); await anon.screenshot({ path: `${OUT}/login.jpg`, type: "jpeg", quality: 88 }); console.log("ok login");
  await b.close();
})();
