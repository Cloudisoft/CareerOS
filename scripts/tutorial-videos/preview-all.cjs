const { chromium } = require("playwright");
const { execSync } = require("child_process");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("file://" + __dirname + "/engine.html"); await p.waitForTimeout(500);
  const names = process.argv[2] ? process.argv[2].split(",") : await p.evaluate(() => Object.keys(window.VIDEOS));
  for (const n of names) {
    const total = await p.evaluate((x) => window.__build(x), n); await p.waitForTimeout(700);
    const mids = await p.evaluate(() => SCENES.map((s) => s.t0 + s.d * 0.8));
    execSync(`rm -f ${__dirname}/prev/${n}-*.jpg`);
    for (let i = 0; i < mids.length; i++) { await p.evaluate((t) => window.__render(t), mids[i]); await p.waitForTimeout(50); await p.screenshot({ path: `${__dirname}/prev/${n}-${i}.jpg`, type: "jpeg", quality: 75 }); }
    execSync(`ffmpeg -loglevel error -y -i ${__dirname}/prev/${n}-%d.jpg -vf "scale=640:-1,tile=3x2:padding=6:color=black" -frames:v 1 ${__dirname}/sheet-${n}.jpg`);
    console.log(n, total.toFixed(1) + "s", mids.length, "scenes");
  }
  await b.close();
})();
