// Renders each tutorial frame by frame (deterministic), adds its own original music, encodes MP4 + poster.
const { chromium } = require("playwright");
const { execSync } = require("child_process");
const fs = require("fs");
const D = __dirname, OUT = D + "/out", FPS = 24; // copy out/*.mp4 and out/*.jpg into public/videos/tutorials
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(D + "/music", { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await p.goto("file://" + D + "/engine.html"); await p.waitForTimeout(500);
  const all = await p.evaluate(() => Object.keys(window.VIDEOS));
  const names = process.argv[2] ? process.argv[2].split(",") : all;
  for (const name of names) {
    const seed = all.indexOf(name);
    const total = await p.evaluate((n) => window.__build(n), name);
    await p.waitForTimeout(900); // images decode
    const dir = `${D}/frames/${name}`; execSync(`rm -rf ${dir} && mkdir -p ${dir}`);
    const frames = Math.round(total * FPS);
    const t0 = Date.now();
    for (let i = 0; i < frames; i++) {
      await p.evaluate((t) => window.__render(t), i / FPS);
      await p.screenshot({ path: `${dir}/${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
    }
    const posterT = await p.evaluate(() => SCENES[0].d * 0.85);
    await p.evaluate((t) => window.__render(t), posterT);
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 });
    execSync(`python3 -I ${D}/music.py ${seed} ${total.toFixed(2)} ${D}/music/raw-${name}.wav`);
    execSync(`ffmpeg -loglevel error -y -i ${D}/music/raw-${name}.wav -af "aecho=0.8:0.6:60|120:0.25|0.15,highpass=f=40,lowpass=f=9000,loudnorm=I=-22:TP=-2:LRA=7" -ar 44100 -ac 2 ${D}/music/${name}.wav`);
    execSync(`ffmpeg -loglevel error -y -framerate ${FPS} -i ${dir}/%05d.jpg -i ${D}/music/${name}.wav -vf "scale=1280:720:flags=lanczos" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 96k -shortest -movflags +faststart ${OUT}/${name}.mp4`);
    execSync(`ffmpeg -loglevel error -y -i ${OUT}/${name}.jpg -vf scale=960:-1 -q:v 5 ${OUT}/${name}-poster.jpg && mv ${OUT}/${name}-poster.jpg ${OUT}/${name}.jpg`);
    execSync(`rm -rf ${dir}`);
    const size = (fs.statSync(`${OUT}/${name}.mp4`).size / 1e6).toFixed(2);
    console.log(`${name}: ${total.toFixed(1)}s, ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s, ${size} MB`);
  }
  await b.close();
})();
