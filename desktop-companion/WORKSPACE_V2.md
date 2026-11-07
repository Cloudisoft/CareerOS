# CareerOS Companion 2.0 — Vysper-inspired features

Development branch: `feature/companion-live-workspace-v2`. Draft PR #32.
Feature ideas: [Vysper](https://github.com/varun-singhh/Vysper). The code on this branch is newly written against CareerOS APIs; **no Vysper code was copied**.

## Implemented in source
- CareerOS sign-in and subscription entitlement checks preserved.
- Visible always-on-top Electron interface for Windows/macOS.
- Existing consent-gated system-audio/microphone transcription and resume-specific interview hints.
- Live transcript list, session timer, and local bounded conversation context (in memory; erased on session reset or restart).
- `Ask AI` typed question workflow, backed by the new `/api/extension/interview/copilot/ask` server endpoint.
- Specialist prompt modes: general, behavioral (STAR), programming, algorithms/DSA, system design, data science, sales, DevOps, presentation, negotiation.
- User-triggered screenshot analysis: the user must click a control and select a display in an explicit confirmation dialog; a resized JPEG is sent to the CareerOS server then the configured OpenAI vision endpoint.
- No periodic screen capture and no screenshot persistence in the Companion.
- Pause/resume of microphone/system-audio tracks while running.
- Local shortcuts: Ctrl/Cmd+Shift+K focuses Ask, Ctrl/Cmd+Shift+L toggles transcript, Ctrl/Cmd+Shift+J opens screen capture confirmation.
- Global Ctrl/Cmd+Shift+Space raises the normal *visible* assistant window.
- Clear session removes local transcript/history and answers, and existing manual notes export remains available.
- Basic new end-to-end test assertions and a PR CI workflow.

## Requires deployment configuration
- An enabled CareerOS AI provider (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or the existing AI gateway options) is needed for specialist text answers.
- Screenshot analysis currently requires `OPENAI_API_KEY` on the **server** and optionally `CAREEROS_VISION_MODEL` (defaults to `gpt-4o-mini`). Never put AI service secrets inside the downloadable app.
- Existing speech-to-text still requires `DEEPGRAM_API_KEY` or `OPENAI_API_KEY`, as configured in CareerOS.

## Implementation boundaries and testing
- This is a development prototype, **not** a fully tested release. No Electron/macOS/Windows build is confirmed yet. Run `cd desktop-companion && npm ci && xvfb-run -a npm test` on Linux or `npm test` on a desktop.
- Screen capture requires OS permissions; test on both Windows/macOS. Windows and macOS capture behavior may differ.
- The screenshot feature uses a vision model directly, not a local Tesseract OCR installation. It returns plain text; rich code syntax-highlighting and automatic diagrams are not yet built.
- Speech recognition currently sends pause-segmented WebM clips, not low-latency streaming partial transcripts.
- Dedicated spoken command parsing, configurable multi-provider model selection from the desktop UI, and additional independent chat windows are **not implemented**.
- The existing notes exporter records interview talking points; text chat answers and screenshot analysis are not auto-exported.
- The original Vysper stealth/undetectability, invisible screen-sharing overlays, monitoring bypass, and process disguise features are intentionally **not implemented**. Any audio/screen capture must be used with required consent and under applicable meeting or assessment rules.
- Before merge: review API rate limits and vision costs, test screen permissions, validate entitlement checks, run CI, and package signed installers through `.github/workflows/desktop-companion.yml`. Do not change the live download URLs until release approval.
