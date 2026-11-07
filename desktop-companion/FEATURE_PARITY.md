# CareerOS Companion feature-parity development

This work independently implements user-facing meeting assistant features. It does **not** copy source code, prompts, trade dress, or private implementation from Smog AI or Natively. The existing CareerOS backend, entitlement checks, Electron app, and production installers are unchanged on this branch.

## Source changes in this iteration

- **Listen:** Retains the current audio capture, explicit consent and pause-segmented transcription.
- **Ask:** Retains the authorized specialist AI endpoint and in-session context.
- **Vision:** Retains the explicitly user-authorized screen selection and screenshot analysis.
- **Notes:** Adds an authenticated `/api/extension/interview/copilot/notes` endpoint for source-grounded Markdown summaries with Summary, Key points, Decisions, Action items, and Open questions.
- **Notes UI:** Generate on demand; optionally auto-generate when the user presses Stop (session-only opt-in); edit summary in a textarea; manually export to Markdown.
- **History:** Adds explicit user-initiated local save, list, keyword search, preview, and delete. The local JSON archive is in the app's user-data directory, mode 0600 on compatible systems. No cloud sync or automatic persistence. A local session can include transcript and typed AI answers; note exports are separate.

## Pending work for full feature parity

- Lower-latency, token-level streaming transcription, timestamps and reliable speaker diarization
- Robust multi-provider AI configuration and user-selected local/offline models
- Multi-window workflows, uploadable documents, retrieval from personal files and prior sessions, more export formats
- Better secure storage at rest, searchable indexes, privacy controls, and optional end-to-end encrypted sync
- Backend usage quotas, provider cost management, real cross-platform smoke testing and signed installers

## Release gates
1. GitHub CI passes desktop end-to-end tests and backend TypeScript checks.
2. Validate AI notes against actual configured providers, consent behavior and error states.
3. Test macOS and Windows app behavior and security, especially local history paths.
4. Review retention/privacy language and model cost controls before any production merge.
5. Do not publish new desktop download artifacts until signed (or explicitly accepting unsigned warnings) and validated.

No stealth overlay, screen-share concealment, monitoring bypass, or unconsented recording is implemented.
