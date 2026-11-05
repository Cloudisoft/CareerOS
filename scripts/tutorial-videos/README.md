# Tutorial videos

The ten 30–45 second tutorials in `public/videos/tutorials` (five on the homepage,
five in the Learning Hub; listed in `src/config/tutorial-videos.ts`) are generated
here: motion graphics in `engine.html`, storyboards in `stories.js`, real Career OS
screens captured by `capture.cjs`, and original background music synthesised by
`music.py` (no third-party audio).

To re-make them (needs ffmpeg and the preinstalled Playwright Chromium):

1. Run the app locally with demo data, then `node scripts/tutorial-videos/capture.cjs`
   (writes `shots/`, not committed).
2. `node scripts/tutorial-videos/preview-all.cjs` to check still frames.
3. `node scripts/tutorial-videos/render.cjs [name,...]`, then copy `out/*.mp4` and
   `out/*.jpg` into `public/videos/tutorials`.
