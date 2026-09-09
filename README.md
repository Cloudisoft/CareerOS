# Career OS

A Career Operating System — Discover → Match → Resume → Apply → Interview → Learn → Connect → Grow — built as a
full-stack SaaS with a companion Chrome extension for Auto Apply.

This README is the final-deliverable summary: architecture, routes, schema, what's genuinely real vs. intentionally
out of scope, and what you need to run it yourself.

## Ground rule this build follows

**No fake functionality.** Every score, match, recommendation, and AI response is computed from real stored data or
comes from a real AI provider call. Where a real provider isn't configured (no `ANTHROPIC_API_KEY`, no Stripe keys),
the feature falls back to a clearly labeled, deterministic dev-mode placeholder rather than pretending to be real —
see `src/lib/ai/gateway.ts` for the pattern. Nothing in this codebase hardcodes a "successful" outcome, a fake score,
or a fabricated dataset dressed up as real.

## Tech stack

- **Framework**: Next.js 14 (App Router), TypeScript, React 18
- **Styling**: Tailwind CSS, small shadcn-style primitives in `src/components/ui`
- **Database**: PostgreSQL via Prisma ORM (`prisma/schema.prisma`)
- **Auth**: DB-backed opaque session tokens (httpOnly cookie, SHA-256 hash stored server-side), bcrypt passwords
- **Billing**: Stripe Checkout + Billing Portal + webhooks
- **AI**: Anthropic SDK behind a single gateway (`src/lib/ai/gateway.ts`), with a mock fallback
- **Charts**: Recharts (admin dashboard)
- **Tests**: Vitest (`npm test`)
- **Browser extension**: Manifest V3 Chrome extension at `extension/` (pre-existing, rewired onto this backend)

## Running it locally

```bash
pnpm install
cp .env.example .env        # fill in at least DATABASE_URL
npx prisma migrate dev      # applies all migrations
npm run db:seed             # seeds skills, demo companies/jobs, learning resources
npm run dev                 # http://localhost:3000
npm test                    # unit tests (matching engine, rate limiter, extension adapter)
npm run build                # production build + typecheck + lint
```

Without `ANTHROPIC_API_KEY` set, every AI feature (Job GPT, resume rewriting, Interview AI, extension cover
letters) runs on a deterministic mock provider that's honestly labeled `[DEV MODE — ...]` in its output — the whole
product is exercisable without any paid API keys. Without Stripe keys, billing routes return a clear
"not configured" error rather than silently pretending to charge a card; `DEV_GRANT_PLAN` in `.env` lets you grant
yourself a plan's entitlements in development to test gated features.

## Credentials / environment variables

See `.env.example` for the full list with inline comments. Summary:

| Variable | Required for | Falls back to |
|---|---|---|
| `DATABASE_URL` | Everything | — (required) |
| `SESSION_SECRET` | Session cookies | — (required) |
| `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `AI_MODEL` | Real AI output | Deterministic mock provider |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Real subscriptions | "Billing not configured" error + `DEV_GRANT_PLAN` escape hatch |
| `RESEND_API_KEY`, `EMAIL_PROVIDER` | Real email delivery | Console-logged email in dev |
| `NEXT_PUBLIC_APP_URL` | Correct links in emails/redirects | `http://localhost:3000` |

## Architecture

### Route groups (`src/app/`)

- `(marketing)` — public pages (home, pricing, features, employers, about, FAQ)
- `(auth)` — login, signup, forgot/reset password, email verification
- `(onboarding)` — the candidate onboarding wizard
- `(app)` — everything behind a session: candidate dashboard, profile, jobs pipeline, Resume Studio, ATS Scanner,
  Job GPT, Interview AI, Learning Hub, Career Circles, Auto Apply Control Center, employer workspace, admin
- `(jobs)` — dual-mode: the job marketplace and public company pages render with the full app shell when signed in,
  and the marketing shell otherwise, since browsing jobs doesn't require an account

Auth is enforced twice, deliberately asymmetrically: a coarse cookie-presence check in edge `middleware.ts` (can't
reach the DB), and an authoritative `getSessionUser()` check in the `(app)` layout that actually validates the
session and redirects to `/login` if it's stale.

### Domain modules (`src/lib/`)

| Module | Responsibility |
|---|---|
| `auth/` | Sessions, password hashing, RBAC guards (`requireCandidate`, `requireEmployer`, `requirePlatformAdmin`, extension bearer auth) |
| `profile/` | Career Profile CRUD + onboarding step persistence |
| `scoring/career-readiness.ts` | Weighted Career Readiness score from real profile/resume/skills/interview/match data |
| `matching/` | The job-matching engine (skills 40% / title 20% / experience 15% / location 15% / salary 10%) — symmetric, so it also scores candidates against a job for Talent Search |
| `resume/`, `ats/` | Resume Studio content model + AI rewriting; ATS Scanner's keyword/structure heuristic (disclosed as an estimate, not a vendor guarantee) |
| `billing/` | Plan/entitlement catalog, Stripe checkout/portal/webhooks |
| `ai/` | The provider gateway (Anthropic ⇄ mock), Job GPT's CareerContext builder |
| `interview/` | Interview AI session generation + per-answer AI scoring |
| `learning/` | Learning Hub catalog + recommendations driven by real missing-skill data from job matches |
| `network/`, `messaging/`, `notifications/` | Career Circles: connections, feed, DMs, notifications |
| `company/`, `employer/` | Employer company profile, job postings, applicant pipeline, Talent Search |
| `autoapply/` | Chrome extension sync payload (Career Profile → extension's flat `Profile` schema), settings, run heartbeats, extension-sourced application logging |
| `extension/` | Extension pairing/device auth + the `ext*` response convention used by every extension-facing route |
| `admin/` | Platform stats, user search/suspend, backed by a real (previously-unused) `AuditLog` table |

### Two API response conventions, on purpose

- **App-facing** (everything the web frontend calls): `apiOk`/`apiError`/`apiCatch` in `src/lib/api-response.ts` →
  `{data: {...}}` / `{error: {message, code}}`.
- **Extension-facing** (the ~14 routes under `/api/extension/*` the Chrome extension itself calls):
  `extOk`/`extError`/`extCatch` in `src/lib/extension/response.ts` → unwrapped JSON / `{error: "string"}`, matching
  the extension's own `careeros-api.js` client exactly.

### Chrome extension integration

The extension (`extension/`) is a sophisticated pre-existing client — discovery, ATS-aware form filling, per-platform
automation policy (auto/assist/discover modes) — that was rewired onto this backend rather than rewritten. It
authenticates via a bearer device token (pairing code or one-click browser tab flow), then drives its run loop
through five endpoints:

- `GET /api/extension/sync` — settings + the candidate's Career Profile mapped into the extension's own flat
  `Profile` schema + today's application count + already-applied URLs
- `GET /api/extension/package` — tailored per-posting packages aren't built yet; this **honestly** returns
  `{tailored: false}` rather than fabricating one, which the extension already treats as the normal case (falls back
  to the base profile)
- `POST /api/extension/application` — logs a real `Application`, resolving/creating `Company`/`Job` rows for
  externally-discovered postings, enforcing the plan's daily limit server-side
- `POST /api/extension/run` — live run heartbeats, persisted so the web Control Center (`/auto-apply`) shows a real
  run rather than a static mock
- `POST /api/extension/package/submitted` — reserved no-op until packages exist

### Database (`prisma/schema.prisma`)

Organized in commented sections: Auth & RBAC → Candidate Profile (experience/education/skills/languages) →
Employer/Company → Jobs & matching → Resume & ATS → Billing (plans/subscriptions/payments) → AI (Job GPT
conversations, Interview AI sessions) → Career Circles (connections/posts/messaging/notifications) → Learning Hub →
Auto Apply (settings/runs). Every model maps to a snake_case table via `@@map`.

## What's real vs. intentionally out of scope

Built and end-to-end tested (curl + Playwright, every phase, against a real Postgres DB):

- Real auth, RBAC, and session handling; real password reset/email verification flows
- Career Readiness scoring computed from actual profile/resume/skills/match data — 0 until you actually have data
- A real weighted matching engine, reused symmetrically for both "jobs for you" and Talent Search
- Real Stripe subscriptions/webhooks/entitlement gating (with an honest "not configured" fallback, never a fake charge)
- Real AI calls for Job GPT, resume rewriting, and Interview AI question generation/scoring (with an honestly-labeled
  mock fallback, never a silently fabricated response)
- Real Career Circles: connection requests, a feed scoped to accepted connections, DMs gated behind an accepted
  connection, notifications
- Real employer workspace: company pages, job posting CRUD, applicant Kanban, Talent Search respecting candidate
  visibility settings
- Real Learning Hub recommendations driven by actual missing-skill data, backed by a curated catalog of real,
  verifiable external resources (official docs, established free courses — not invented course titles)
- Real Auto Apply: extension pairing, profile sync, application logging, daily-limit enforcement, live run
  heartbeats, a Control Center with real settings and real recent-activity data
- Real admin dashboard: live platform counts (users by role, subscriptions by plan, applications by source, AI usage),
  user search/suspend/reactivate with real audit logging

Deliberately not built, and disclosed rather than faked:

- **Tailored application packages** (a pre-approved cover letter + resume + screening answers for one specific
  posting) — `/api/extension/package` always reports none exist yet; the extension already degrades gracefully to
  the base profile, so nothing is broken, just not yet built.
- **Employer billing** — the employer workspace (jobs, pipeline, Talent Search) is fully functional and currently
  ungated; there's no employer-side Stripe plan defined yet.
- **Per-platform Auto Apply overrides** (`platformModes`) — the schema and sync payload support it, but the Control
  Center UI doesn't expose per-ATS overrides yet; the extension's own built-in policy defaults apply.
- **Multi-instance rate limiting** — `src/lib/rate-limit.ts` is an in-memory fixed-window limiter, fine for a single
  instance; a real multi-instance deployment should back it with Redis using the same interface (the file says so).
- **Strict CSP with nonces** — `next.config.mjs` ships a real Content-Security-Policy (no framing, no third-party
  script origins, restricted `connect-src`) but keeps `'unsafe-inline'`/`'unsafe-eval'` in `script-src` rather than
  wiring per-request nonces through Next's own inline bootstrap scripts.

## Testing

`npm test` runs the Vitest suite: the matching engine's scoring logic across multiple scenarios, the rate limiter's
window/reset behavior, and the Auto Apply Career-Profile-to-extension-schema adapter. These are the pure,
DB-independent business logic with the highest value-per-test; every phase was additionally verified by hand against
a real Postgres database via curl (full user journeys — signup through to the feature under test) and Playwright
screenshots of the resulting UI, which is how every feature described above was actually confirmed working rather
than assumed from reading the code.

## Known limitations

- No automated integration/E2E test suite runs in CI (all API-level verification during the build was manual
  curl/Playwright, not codified into a repeatable suite) — a real next step, not a gap that was hidden.
- The ATS Scanner's score is a disclosed keyword/structure heuristic, not a claim of matching any specific vendor's
  actual parsing.
- Company records created from extension-discovered job applications are name-matched/deduplicated among
  themselves but never merged into a real employer's own `Company` row (see `src/lib/autoapply/service.ts`) — this
  is a deliberate safeguard, not a bug, but means the same real-world company can end up with two rows if it exists
  both as a registered employer and as an extension-discovered posting source.
- Email delivery defaults to console logging in development; configure `RESEND_API_KEY` (or another provider) for
  real delivery.
