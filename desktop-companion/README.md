# CareerOS Interview Companion (desktop)

A small, always-on-top window for Mac and Windows that works beside any call app (Zoom, Teams, Google Meet,
Webex, in the browser or the desktop app). When the person starts it, it listens to the computer's call audio
(or the microphone); when the interviewer asks a question it shows a few talking points and a matching story
from the person's own CareerOS resume and saved stories. Questions and points can be saved as notes.

It is an ordinary, visible window: it appears in screen shares and recordings like any other app. Before first
use it shows a one-time disclosure (visible window; tell others where required; some employers don't allow AI
help; audio isn't stored).

## How it works

- **Sign in**: the same approval flow as the browser extensions (`/api/extension/connect/*`): the app opens
  `/extension-connect?state=…` in the browser and shows the code the page shows. Approving gives the app a
  device token, listed with the other devices in Settings → Connected browsers.
- **Audio**: `src/lib/segmenter.js` (shared with `interview-extension/`) cuts the audio at the speaker's pauses
  into complete WebM clips; silence is never sent.
- **AI**: all on the CareerOS server, the same endpoints as Live Copilot:
  `POST /api/extension/interview/live/transcribe` (Deepgram, else OpenAI) and
  `POST /api/extension/interview/live/assist` (Anthropic, else OpenAI). No keys live in the app.
- **Access**: needs Interview AI on the account (a plan with it, or the add-on, or an admin grant).
  Choosing a specific job needs Premium or higher, as in the extension.

## Develop

```bash
cd desktop-companion
npm install
npm start                       # against production
CAREEROS_WEB_URL=http://localhost:3000 npm start   # against a local CareerOS
xvfb-run -a npm test            # end-to-end test (Linux; `npm test` on a desktop)
```

## Build the installers

Mac and Windows installers are built on GitHub Actions (`.github/workflows/desktop-companion.yml`):
GitHub → Actions → **Desktop companion** → **Run workflow** (or push a tag `companion-v1.0.0`). The `.dmg` and
`.exe` are attached to the run as artifacts.

Locally: `npm run dist:mac` (on a Mac), `npm run dist:win` (on Windows), `npm run dist:linux`.

### Signing (recommended before giving it to users)

Unsigned builds work, but macOS shows "unidentified developer" (right-click → Open the first time) and Windows
SmartScreen shows "Windows protected your PC" (More info → Run anyway). To sign, add repository secrets:

- macOS: `CSC_LINK` (base64 Developer ID Application .p12), `CSC_KEY_PASSWORD`, and for notarization
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` (Apple Developer Program, $99/year).
- Windows: `CSC_LINK` / `CSC_KEY_PASSWORD` for a code-signing certificate.

## Publish

Upload the `.dmg` and `.exe` somewhere public (a storage bucket or CDN), then set on the CareerOS server:

- `NEXT_PUBLIC_COMPANION_MAC_URL`
- `NEXT_PUBLIC_COMPANION_WIN_URL`

`/download` shows the download buttons once they are set (and "Coming soon" until then).

## Permissions it asks for

- macOS: Screen Recording (macOS shares a call's audio through it; only the audio is used) and, if the
  microphone is chosen, Microphone.
- Windows: none beyond the microphone when chosen; call audio is captured from the system output.
