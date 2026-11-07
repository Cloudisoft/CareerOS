# CareerOS Companion — Vysper-inspired workspace (development branch)

This branch extends the existing CareerOS Electron Companion, without replacing its sign-in, entitlement checks, CareerOS server-side AI endpoints, or audio pipeline.

## Added in this iteration
- Live session duration indicator and status strip
- In-session transcript timeline (transcribed audio segments already returned from CareerOS)
- Typed "Ask AI" input using the existing `/interview/live/assist` endpoint
- Interview skill presets: general, behavioral/STAR, programming, DSA, system design, data science, sales/negotiation, and DevOps
- Clear-session control (clears local in-memory transcript, talking points, and session notes)
- In-window shortcuts: Ctrl/Cmd+Shift+K focuses Ask AI; Ctrl/Cmd+Shift+L toggles transcript

## Important limitations
- Typed questions and skill prefixes use the existing **question detection and resume-backed talking-point API**. The backend may decide that a prompt is not a question; arbitrary coding solutions, specialized skill reasoning, and chat response formatting are **not yet supported**. These require a separate authorized backend API and testing.
- The transcript is segmented after speaker pauses, not token-by-token streaming.
- These changes have not yet passed the Electron end-to-end test suite or platform installer builds.
- The live website and default branch are unchanged.

## Source of ideas / licensing
Feature design was informed by [Vysper](https://github.com/varun-singhh/Vysper), notably its skill selection, session memory, and keyboard access. No Vysper source code has been copied into this branch. Vysper's top-level LICENSE is Apache-2.0, whereas its package.json advertises ISC; verify file-level licensing before any subsequent direct code reuse.

No concealed overlay, screenshot evasion, or monitoring-bypass behavior is implemented. CareerOS stays visible to screen-sharing participants. Obtain required permissions and consent before using audio transcription.

## Before release
1. Run `cd desktop-companion && npm ci && npm test` on a supported desktop environment.
2. Verify microphone and system audio, account pairing, session history, and sign-out on Windows and macOS.
3. Validate typed prompts against live and mock backend responses, including the no-answer response.
4. Review security, accessibility, and permission UX.
5. Build signed Windows/macOS installers with the repository's existing GitHub Actions workflow, then update download URLs after approval.
