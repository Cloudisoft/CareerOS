# CareerOS — architecture

An onboarding map for engineers joining the repo. It describes what's actually
here today, not the roadmap (see `docs/ROADMAP.md` for the phased plan this
document supports — this file is the Phase 0 audit deliverable).

## 1. Shape of the repo

```
src/app/            Next.js App Router. Route groups by audience:
  (marketing)/       public marketing pages (about, pricing, features...)
  (auth)/            login/signup/forgot-password/reset-password/verify-email
  (onboarding)/      the post-signup profile-building flow
  (jobs)/            public job board pages (jobs, company)
  (app)/             the authenticated product: dashboard, applications,
                     resume-studio, cover-letter-studio, ats-scanner,
                     auto-apply, job-gpt, interview-ai, learning, network,
                     messages, notifications, profile, settings, admin,
                     employer, checkout
  api/                route handlers, grouped the same way (see §4)
  extension-connect/  the web-side page the extension's "Sign in" flow opens

src/lib/            Domain logic, one directory per bounded concern:
  ai/                the AI gateway + Job GPT service (§3)
  auth/               session + extension device-token auth + RBAC guards (§4)
  billing/           plans/entitlements/PayPal sync (§5)
  jobs/, company/     job board + company domain logic
  applications/       application lifecycle
  resume/             resume parsing/scoring/cover-letter generation
  ats/                ATS keyword/structure scanning
  interview/          Interview AI (sessions, prep packs, stories, live copilot)
  autoapply/          server-side glue for the Auto Apply extension
  matching/           job/profile match-scoring engine
  employer/           employer-side job posting, applicant review
  admin/              platform-admin tooling
  learning/           Learning Hub + Courses
  network/, messaging/, notifications/  Career Circles (social layer)
  paypal/, geo/, email/, scoring/, audit/, validations/, test/

prisma/schema.prisma  Single schema file, organized in commented sections
                       (see the `// ===...===` banners) rather than split
                       across files — auth/RBAC, candidate profile, employer/
                       company, jobs, resume, notifications, extension,
                       applications, billing, AI, interview AI, prep packs,
                       "my stories", auto apply, extension selector overrides,
                       learning, courses, career circles (social).

extension/            "Auto Apply" Chrome extension (MV3)
interview-extension/  "Interview Prep" Chrome extension (MV3) — standalone
```

Route groups (`(app)`, `(auth)`, etc.) share no code by virtue of the
parenthesized folder name — that's purely a Next.js URL-organization
convention; the actual authorization boundary is enforced in `src/lib/auth`
(§4) and in each domain's service functions, not by which route group a page
lives in.

## 2. Prisma schema organization

`prisma/schema.prisma` is one 1400+ line file, deliberately kept as a single
source of truth with banner comments dividing it into domains (grep for
`// ====`). Two structural habits worth knowing before adding a model:

- **Soft delete over hard delete** where a row has real history attached
  (`User.deletedAt`, `Company.deletedAt`, `Job.deletedAt`, `Post.deletedAt`) —
  cascading FKs (`onDelete: Cascade`) are used for genuinely dependent rows
  (a session, a work experience, a job skill), while `SetNull` is used where
  the parent disappearing shouldn't destroy the child's own record (e.g.
  `Application.resumeId` on `SetNull`, `Resume.targetJobId` on `SetNull`).
- **"Why" comments precede almost every non-obvious model.** Read them before
  assuming a table's purpose from its name — e.g. `Job.expiresAt`'s comment
  explains it's "a real, non-cron way of keeping 'no longer available' honest"
  instead of relying on an external board to tell CareerOS a job filled;
  `InterviewPrepPack` explains it's built once (at `INTERVIEW` status) and
  reused rather than regenerated per view; `ExtensionSelectorOverride` explains
  why it's one JSON blob instead of a table-per-selector (mirrors the
  extension's own `ADAPTERS` shape, and a v1 doesn't need more).

Sibling-model shapes worth copying when adding new tables (relevant to §6):
`InterviewSession` → `InterviewQuestion` (parent capped at a handful of enum
statuses, child carries the actual scored content and an `attempts` counter);
`AutoApplyRun` (a denormalized counters row — `queued/submitted/assisted/
skipped/failed` — updated in place rather than derived by aggregate query,
because the extension needs to push live counts cheaply).

## 3. The AI gateway — `src/lib/ai/gateway.ts`

**Verified: every AI provider call in the codebase goes through this one
file.** A repo-wide search for `new Anthropic(`, `from "@anthropic-ai`, and
`new OpenAI(` outside `gateway.ts` returns zero matches — no other file talks
to a provider SDK or a raw completions endpoint directly. Every feature
(resume rewriting, cover letters, ATS explanations, Job GPT, Interview AI
scoring/questions/prep, thank-you emails) calls `generateText` or
`generateChat` exported from this file. This is a real, currently-honored
architectural rule, not just a stated intention — worth protecting in any
future change (see gap analysis below: the fix should stay inside this file).

What it actually does today:

- **Provider abstraction**: a small `AiProvider` interface
  (`generateText`/`generateChat`) implemented by `AnthropicAiProvider`,
  `OpenAiCompatibleProvider` (covers OpenRouter, AgentRouter, and OpenAI
  itself — they're all OpenAI Chat Completions-compatible, so one class
  parameterized by base URL/key/model covers all three), and a
  `MockAiProvider`.
- **Dev-mode fallback, not fake data**: `MockAiProvider` never calls a
  network; it returns an obviously-labeled `[DEV MODE — no AI provider
  configured...]` placeholder. This is the project's anti-faking discipline
  applied to the gateway itself — the rest of the product stays exercisable
  locally without credentials, but nobody can mistake a mock reply for a real
  model output.
- **Provider selection**: `AI_PROVIDER` env var picks one explicitly, or it
  probes `anthropic → openrouter → agentrouter → openai` in order and uses
  the first with a configured API key. Falls back to mock if none configured.
  Selection is cached process-wide (`cachedPrimary`/`cachedFallback`).
- **One fallback retry**: if the primary provider call throws, it retries
  once against OpenAI direct (the "standing fallback"), unless OpenAI *is*
  the primary already, or the primary is the mock provider (nothing to fall
  back from). Both failures are logged and the second error propagates.
- **A 45s hard timeout** per provider call (`PROVIDER_TIMEOUT_MS`) so a
  stalled provider becomes a catchable error instead of hanging the request
  indefinitely — this is what makes the fallback-retry meaningful.
- **`effort` parameter** (`"low" | "medium" | "high"`) is accepted on both
  `GenerateTextInput`/`GenerateChatInput` and passed to Anthropic's
  `output_config.effort`, but only the `AnthropicAiProvider` honors it — the
  `OpenAiCompatibleProvider` implementation ignores `effort` entirely.

### Gap vs. the roadmap's ask ("fast/deep model tiers, streaming, per-user usage limits")

1. **Model tiers — not implemented as tiers, only as an unused enum-shaped
   knob.** Model choice is currently one fixed model per provider (from
   `AI_MODEL`/`AI_FALLBACK_MODEL` env vars), selected once at process start,
   not per call. `GenerateTextInput.effort` looks tier-like but only affects
   Anthropic's reasoning-effort setting, not model selection, and no call
   site actually varies it today (every call site that sets `effort` uses the
   default `"low"`). There is currently no way for a caller to ask for a
   "fast" vs. "deep" model on the same request.
2. **Streaming — not supported at all.** Both `generateText`/`generateChat`
   return a fully-materialized string; no provider implementation uses
   streaming (`stream: true` for OpenAI-compatible providers, or
   `client.messages.stream` for Anthropic), and there's no gateway export
   that returns an async iterable / ReadableStream. Every caller currently
   awaits a complete response.
3. **Per-user usage limits — real, but they live outside the gateway, per
   feature, not inside it.** Confirmed pattern (see
   `src/app/api/job-gpt/conversations/[id]/messages/route.ts` and
   `src/app/api/extension/package/route.ts`):
   - A **monthly cap** comes from `src/lib/billing/entitlements.ts`
     (`jobGptMonthlyMessageLimit`, `interviewSessionMonthlyLimit`, etc., all
     defined per-plan in `src/lib/billing/plans.ts`), enforced by each route
     counting its own rows (e.g. `countMonthlyUserMessages`) before calling
     the gateway.
   - A **per-minute throttle** comes from `src/lib/billing/priority.ts`'s
     `rateLimitForTier(entitlements.aiPriorityTier)` (tiers: `standard` 
     limited, `priority` = 40/min, `highest` = 100/min — see that file for
     exact standard-tier numbers), applied through the generic in-memory
     `rateLimit()` in `src/lib/rate-limit.ts`, keyed per feature+user (e.g.
     `` `job-gpt:${user.id}` ``).
   - `AiUsage` (Prisma model: `userId`, `feature`, `provider`, `createdAt`)
     exists as a usage log, but it's a record of *what happened*
     (which feature, which provider served it), not itself the enforcement
     mechanism — the caps above are enforced from feature-specific tables
     (`AiMessage` counts, `InterviewSession` counts), not from `AiUsage`.

   So: entitlement caps are real and already per-user, but they are
   duplicated per call site (each route re-implements "count this month's
   rows, compare against the plan limit, apply the per-minute rate limit")
   rather than being a single reusable primitive.

**Smallest change that closes the gap without breaking the one-gateway
discipline** (proposed, not implemented in this pass):
- *Tiers*: add a `tier?: "fast" | "deep"` field to `GenerateTextInput`/
  `GenerateChatInput`, and change `buildProvider`/`AnthropicAiProvider` (and
  the `OpenAiCompatibleProvider` model-selection call site) to hold two model
  strings per provider (`AI_MODEL_FAST`/`AI_MODEL_DEEP` env vars, falling
  back to the current single `AI_MODEL` for both if only one is set) and pick
  between them based on `tier` (default `"fast"` to keep current cost/latency
  unless a call site opts into `"deep"`). This stays entirely inside
  `gateway.ts` — call sites just start passing `tier`.
- *Streaming*: add sibling exports `streamText`/`streamChat` returning an
  `AsyncIterable<string>` (chunks), implemented per-provider (Anthropic:
  `client.messages.stream()`; OpenAI-compatible: `stream: true` + SSE
  parsing) with the *same* timeout/fallback semantics as the non-streaming
  path, but keep `generateText`/`generateChat` unchanged so today's ~15+ call
  sites need no changes — only genuinely-interactive surfaces (Job GPT chat,
  a future Live Copilot) adopt the new export.
  Mock provider gets a matching streamed-chunk version of its placeholder so
  dev mode stays exercisable.
- *Usage limits*: extract the "count this period's usage against an
  entitlement, then rate-limit per minute by tier" logic that's currently
  copy-pasted per route into one helper (e.g.
  `src/lib/billing/enforceAiUsage(userId, feature, entitlementKey)`) that
  wraps the existing `requireEntitlement` + `rateLimitForTier` + `rateLimit`
  calls. This doesn't move enforcement into `gateway.ts` itself (the gateway
  has no concept of "which feature" or "which entitlement" a call belongs
  to, and shouldn't — that's a billing/product concern, not a provider
  concern) — it just deduplicates the pattern that's already right, so
  adding a new AI feature doesn't mean re-deriving it. This matches the
  existing division of responsibility rather than fighting it.

## 4. Auth — two real, deliberately separate patterns

`src/lib/auth/` (`session.ts`, `extension.ts`, `guards.ts`, `crypto.ts`,
`rbac.ts`, `constants.ts`, `service.ts`) implements two independent auth
flows for two different clients:

**1. Web app — session cookie.** `createSession`/`getSessionUser`/
`destroySession` in `session.ts`. A `Session` row stores only the SHA-256
hash of the token (`tokenHash`, unique) — the raw token lives only in the
httpOnly cookie, so a leaked DB row can't be replayed as a cookie (this is
stated directly in the model's doc comment). 30-day TTL, checked against
`user.status`/`deletedAt` on every read, not just at login.

**2. Extension — bearer device token.** `requireExtensionUser`/
`requireExtensionCandidateProfile` in `extension.ts`. Reads
`Authorization: Bearer <token>`, hashes it, looks up an `ExtensionSession`
row (separate table from `Session`, same hash-not-raw-token storage
pattern), and updates `lastSeenAt` on every call — this is how the web
Control Center can show "last seen" for a paired browser. Two ways a token
gets there in the first place: `ExtensionPairingCode` (a 6-character code
typed manually into the extension's options page) or
`ExtensionConnectRequest` (a one-click flow: the extension opens
`/extension-connect` in a real tab, the already-logged-in user approves
there, the extension polls `pendingToken` until it appears, then it's
cleared immediately). Every `/api/extension/*` route uses this bearer path,
never the session cookie — the extension is a separate, unprivileged client
by design, not a logged-in browser tab.

**Role/permission guards** (`guards.ts`) are coarse-grained, one `UserRole`
enum check per guard: `requireCandidate` (role `CANDIDATE`, also loads/
creates the `CandidateProfile`), `requirePlatformAdmin` (role
`PLATFORM_ADMIN`), `requireEmployer` (role `EMPLOYER` **or**
`COMPANY_ADMIN` — both count as "an employer"), and `requireEmployerCompany`
(calls `requireEmployer` then additionally requires a `CompanyMember` row,
throwing a distinct `NeedsCompanyError`/`NEEDS_COMPANY` so the UI can route
to "create your company" instead of a bare 403). See §6 for how this compares
to the roadmap's four target roles.

There is also a separate, currently-unused fine-grained RBAC layer already
in the schema: `Role`/`Permission`/`RolePermission` (many-to-many) — these
exist for future per-company-team permission checks (e.g. "who on an
employer team can publish jobs") but nothing in `guards.ts` reads them yet;
today's authorization is entirely the coarse `UserRole` enum switch.

## 5. Major domains

- **Jobs & companies** (`src/lib/jobs`, `src/lib/company`, `Job`/`Company`
  models): currently a "skeleton" by the schema's own comment
  (`// JOBS (skeleton — expanded in Phase 3)` — note this predates/doesn't
  match this document's roadmap's phase numbering, it's an artifact of an
  earlier internal plan) — has `Job`/`JobSkill`/`SavedJob`/`JobMatch` and
  `Company`/`CompanyMember`/`CompanyFollower` today; Phase 1 of the current
  roadmap is where ingestion/search/pages get built on top of this.
- **Applications** (`src/lib/applications`, `Application`/
  `ApplicationEvent`): one row per (profile, job) pair, unique-constrained,
  with an append-only `ApplicationEvent` history of status transitions.
- **Resumes** (`src/lib/resume`, `src/lib/ats`, `Resume`/`ResumeScore`):
  resumes store structured content as `Json`; `ResumeScore` is a point-in-time
  scoring snapshot (optionally against a specific `Job`), not mutated in
  place, so score history is preserved.
- **Interview AI** (`src/lib/interview`, `InterviewSession`/
  `InterviewQuestion`/`InterviewPrepPack`/`InterviewStory`): three related
  but intentionally separate concepts — a **mock interview session**
  (adaptive, scored per question), a **prep pack** (auto-generated once an
  `Application` reaches `INTERVIEW` status, reused rather than regenerated,
  per its doc comment), and **"My Stories"** (a locked personal STAR-format
  answer bank for core behavioral questions, shared with the standalone
  Interview Prep extension). All three route through the same gateway and
  the same "ground everything in the candidate's real background, never
  invent" system-prompt discipline (§7).
- **Billing/entitlements** (`src/lib/billing`, `Subscription`/
  `AddOnSubscription`/`Payment`): `plans.ts` is the single source of truth
  for what each plan/add-on unlocks (`Entitlements` interface); `Infinity` is
  used as the in-code "unlimited" sentinel and explicitly converted to `null`
  at the API boundary (`serializeEntitlements`) since `Infinity` doesn't
  survive JSON. PayPal is the only payment processor wired up
  (`src/lib/paypal`); a `DEV_GRANT_PLAN` env-var escape hatch exists for
  local testing, explicitly disabled whenever PayPal is configured or in
  production.
- **Admin** (`src/lib/admin`, `(app)/admin`, `requirePlatformAdmin`):
  platform-admin-only surfaces — includes `ExtensionSelectorOverride`
  management (patching a broken ATS selector without a store release).

## 6. The two Chrome extensions

Both extensions are **intentionally fully independent** — they share no
code, no shared package, no shared manifest scaffolding — and both talk only
to the same backend (`/api/extension/*`), never to each other.

- **`extension/`** — "Auto Apply." Automates filling and submitting job
  applications on external ATSes (Workday, Taleo, Greenhouse, etc. — see
  `extension/lib/ats.js`'s per-ATS adapters). Talks to
  `/api/extension/{jobs,application,run,sync,package,selectors}` and reports
  live run state back into `AutoApplyRun` so the web Control Center reflects
  what the extension is actually doing, not a static mock (see that model's
  doc comment). `ExtensionSelectorOverride` exists specifically so a DOM
  change on an ATS can be hot-patched from the admin panel without a Chrome
  Web Store release cycle.
- **`interview-extension/`** — "Interview Prep." A standalone practice
  companion — mock interviews plus the "My Stories" answer bank. Talks to
  `/api/extension/interview/*` and shares the pairing/connect auth flow
  (`ExtensionSession`/`ExtensionPairingCode`/`ExtensionConnectRequest`) with
  Auto Apply, but that's backend infrastructure reuse, not extension-to-
  extension coupling — each extension pairs itself independently and would
  work fine if the other were never installed. It also has an opt-in "Live
  Copilot" (browser-only) — a precursor to the roadmap's Phase 4, currently
  scoped to that extension's own UI and `src/lib/interview/live.ts`'s
  grounding rules (never invents a hint beyond the real prep pack /
  transcript).

Both extensions authenticate purely via the bearer device-token path (§4) —
neither one ever holds or sends the web session cookie.

## 7. The "never invent facts" discipline — a template for Phase 2

The roadmap's Phase 2 (AI Toolkit) requires outputs that "pull from Career
Profile; never invent facts." That discipline is **already implemented and
battle-tested** in this codebase — it should be copied, not reinvented:

- `src/lib/interview/prep.ts`: *"Ground everything ONLY in the CareerContext
  ... and the job/company details given below — never invent experience,
  employers, metrics, or facts the candidate's history doesn't support...
  If the candidate's history doesn't support N distinct stories, return fewer
  rather than inventing any."*
- `src/lib/interview/service.ts`: *"Ground every question only in the
  candidate's real background (CareerContext)... never invent facts about
  them,"* and for thank-you emails: *"Never invent employers, dates, or
  achievements beyond the CareerContext given... No placeholders like
  '[Company Name]' — use the real company and role given."*
- `src/lib/interview/live.ts`: hints during a live session are explicitly
  "never invented... a pointer, not a script," sourced only from the real
  prep pack.
- `src/lib/resume/cover-letter.ts`: shares a `GROUNDING_RULE` constant
  applying the same rule to cover letters.

The pattern: build a real "context" object from actual DB rows (profile,
job, application, prior questions/scores — never placeholder text), put the
grounding instruction directly in the system prompt in explicit, unambiguous
language, and — critically — instruct the model to *produce less rather than
fabricate* when the real data doesn't support the requested amount of output
(fewer stories, not invented ones). Phase 2's Cover Letter / Email / Question
Response / Resume Review generators should build their `CareerContext`
inputs and system prompts the same way, likely reusing or extending the
existing context-building helpers in `src/lib/interview` and
`src/lib/resume` rather than writing new ones.

---

# DB table audit (roadmap Phase 0 checklist)

Roadmap list: `job`, `company`, `interview_session`, `toolkit_output`,
`bounty`, `referral`, `payout`.

## Already exists

| Roadmap name | Prisma model | Notes |
|---|---|---|
| `job` | `Job` | Exists (see §5). Fields: `title`, `description`, `location`, `workplaceType`, `employmentType`, `careerLevel`, `salaryMin/Max/Currency`, `status` (`DRAFT/OPEN/CLOSED/ARCHIVED`), `externalUrl`, `externalId`, `source` (defaults `"careeros"`), `expiresAt`. Unique on `[source, externalId]` (dedupe key ready for Phase 1's multi-source ingestion), indexed on `companyId`/`status`. Relations: `skills` (`JobSkill`), `savedBy`, `matches`, `applications`, `resumeScores`, `interviewSessions`, `interviewPrepPacks`, `targetedResumes`. |
| `company` | `Company` | Exists. Fields: `slug` (unique), `name`, `logoUrl`, `coverUrl`, `description`, `industry`, `size`, `location`, `website`, `linkedinUrl`, soft-deletable (`deletedAt`). Relations: `members` (`CompanyMember`, with `OWNER/ADMIN/RECRUITER/MEMBER` roles), `followers`, `jobs`. |
| `interview_session` | `InterviewSession` | Exists. Fields: `profileId`, optional `jobId`, `type` (`BEHAVIORAL/TECHNICAL/MIXED`), `status` (`IN_PROGRESS/COMPLETED`), `overallScore`, `summary`, `completedAt`. Child `InterviewQuestion` carries `order`, `category`, `question`, `answer`, `score`, `feedback`, `strengths[]`, `improvements[]`, `attempts`. |

## Doesn't exist yet — confirmed net-new

- **`toolkit_output`** — no model by this or a similar name. **Closest
  existing relative**: nothing stores generated cover letters, question
  responses, or resume reviews as their own persisted history today.
  - Cover letters: `src/lib/resume/cover-letter.ts` generates them on demand
    and `Application.coverLetter` stores only the *current* one used for a
    specific application (one column, overwritten, no history, no standalone
    "generation" record).
  - Resume reviews: `ResumeScore` is the closest analog in shape (a scored,
    timestamped, non-mutated snapshot linked to a `Resume` and optionally a
    `Job`) but it's ATS-keyword-scoring specific (`keywordScore`,
    `formatScore`, `matchedKeywords[]`, etc.), not a generic "AI toolkit
    output" container, and has no concept of tool type, input parameters, or
    a free-form generated body.
  - There is no existing "natural home" to repurpose — Phase 2 genuinely
    needs a new model. Proposed shape below is modeled on `ResumeScore`'s
    "timestamped snapshot linked to its subject, never mutated" pattern and
    `InterviewPrepPack`'s "structured `Json` payload + a couple of hoisted
    scalar fields for querying" pattern.
- **`bounty`** — no model, no partial equivalent anywhere in the schema.
- **`referral`** — no model. **Closest existing relative**: `Application`
  tracks profile↔job, and `Connection` tracks user↔user networking, but
  neither models "person A vouches for person B into a specific job/bounty."
  `ApplicationSource` does have an `EXTENSION` value and an `ASSISTED`
  value, but nothing referral-shaped. Genuinely net-new.
- **`payout`** — no model. `Payment` exists but is inbound-only (a
  subscription/add-on charge *from* a user, `paypalTransactionId`,
  `amount`, `status`, tied to `userId` as the payer) — structurally it could
  be mirrored for outbound payouts but should not be reused directly, since
  payouts are a **payments-gate item** (see below) and want their own
  auditable trail distinct from subscription billing.

## Proposed models (report only — not written to schema.prisma)

These are proposed text for review; they follow this schema's existing
conventions (cuid ids, `@@map` snake_case table names, soft-delete only where
there's real history to preserve, status enums over free-text, indexes on
every FK and every field likely to be filtered/sorted on).

```prisma
// ============================================================
// AI TOOLKIT — persisted output of each AI Toolkit generator run
// (Cover Letter, Email, Question Response, Resume Review — Phase 2).
// Mirrors ResumeScore's "timestamped, never-mutated snapshot" pattern:
// every generation is its own row, so a candidate can see/reuse past
// outputs rather than only the most recent one.
// ============================================================

enum ToolkitType {
  COVER_LETTER
  EMAIL
  QUESTION_RESPONSE
  RESUME_REVIEW
}

model ToolkitOutput {
  id        String           @id @default(cuid())
  profileId String
  profile   CandidateProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  type ToolkitType

  /** The job this output was generated for, if any (cover letters/emails
      are usually job-specific; a resume review may not be). */
  jobId String?
  job   Job?    @relation(fields: [jobId], references: [id], onDelete: SetNull)

  /** Free-form input the candidate supplied beyond their Career Profile
      (e.g. a pasted question to respond to, a recipient name for an email).
      Never used to invent facts — only Career Profile + Job data is
      grounding; this is prompt input, not a source of truth. */
  input Json?

  /** The generated body. */
  output String

  /** Which AI provider actually served this call (see AiUsage) — kept here
      too since AiUsage rows are not queryable per-output. */
  provider String

  createdAt DateTime @default(now())

  @@index([profileId])
  @@index([profileId, type])
  @@index([jobId])
  @@map("toolkit_outputs")
}
```

```prisma
// ============================================================
// EARN — referral bounties (Phase 5). Confirm with the user before this
// migration ships — bounty/payout tables underpin a payments feature and
// this file's own gate list requires explicit confirmation before any
// migration touching payments is created.
// ============================================================

enum BountyStatus {
  DRAFT
  OPEN
  PAUSED
  CLOSED
}

model Bounty {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  jobId     String? // optional: a bounty can target a specific open Job
  job       Job?    @relation(fields: [jobId], references: [id], onDelete: SetNull)

  title           String
  description     String
  status          BountyStatus @default(DRAFT)
  amountCents     Int
  currency        String       @default("USD")
  /** Paid once the referred candidate reaches INTERVIEW (or similar). */
  interviewBonusCents Int @default(0)
  /** Paid after the post-hire guarantee period. */
  hireBonusCents      Int @default(0)
  guaranteeDays       Int @default(90)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  closedAt  DateTime?

  referrals Referral[]
  payouts   Payout[]

  @@index([companyId])
  @@index([status])
  @@map("bounties")
}

enum ReferralStatus {
  PENDING_CONSENT   // candidate consent email sent, not yet confirmed
  CONSENTED
  SUBMITTED         // visible to employer
  INTERVIEWING
  HIRED
  REJECTED
  WITHDRAWN
}

model Referral {
  id       String @id @default(cuid())
  bountyId String
  bounty   Bounty @relation(fields: [bountyId], references: [id], onDelete: Cascade)

  referrerId  String
  referrer    User   @relation("ReferralsMade", fields: [referrerId], references: [id], onDelete: Cascade)
  /** The person being referred — may not have a CareerOS account yet, so
      this is captured as plain fields, not a required User relation, until/
      unless they sign up and the candidate side of the flow links them. */
  candidateName  String
  candidateEmail String
  candidateUserId String?
  candidateUser   User?  @relation("ReferralsReceived", fields: [candidateUserId], references: [id], onDelete: SetNull)

  endorsement String
  status      ReferralStatus @default(PENDING_CONSENT)

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  consentedAt DateTime?

  payouts Payout[]

  @@index([bountyId])
  @@index([referrerId])
  @@index([status])
  @@map("referrals")
}

enum PayoutStatus {
  PENDING
  PAID
  FAILED
  CANCELED
}

enum PayoutTrigger {
  INTERVIEW_REACHED
  HIRE_CONFIRMED
}

model Payout {
  id         String @id @default(cuid())
  bountyId   String
  bounty     Bounty @relation(fields: [bountyId], references: [id], onDelete: Cascade)
  referralId String
  referral   Referral @relation(fields: [referralId], references: [id], onDelete: Cascade)
  referrerId String
  referrer   User   @relation(fields: [referrerId], references: [id], onDelete: Cascade)

  trigger     PayoutTrigger
  amountCents Int
  currency    String       @default("USD")
  status      PayoutStatus @default(PENDING)

  paypalPayoutId String? @unique

  createdAt DateTime  @default(now())
  paidAt    DateTime?

  @@index([bountyId])
  @@index([referrerId])
  @@index([status])
  @@map("payouts")
}
```

Notes on the proposal:
- `ToolkitOutput` has no payments/consent/deletion implications and could be
  migrated in Phase 2 without triggering a roadmap gate — flagged here only
  because it was asked for in this audit.
- `Bounty`/`Referral`/`Payout` all sit squarely inside the roadmap's
  **payments gate** (escrow/payout) and **consent gate** (candidate consent
  email before an employer sees a referral) — per `docs/ROADMAP.md`'s own
  rules, none of this should be migrated without the user's explicit
  confirmation, regardless of how complete the proposal looks. `Referral`
  additionally needs a decision this audit shouldn't make unilaterally: how
  strictly to model a referred candidate who has no CareerOS account yet.

# LLM gateway audit

See §3 above (full detail). Summary for the checklist:

- **Fast/deep tiers**: not implemented. Single model per provider, fixed at
  process start via env vars; `effort` exists but is a reasoning-effort knob
  on Anthropic only, not a model-tier selector, and no call site varies it.
- **Streaming**: not implemented. `generateText`/`generateChat` are
  complete-response only; no provider path streams.
- **Per-user usage limits**: implemented, but at the entitlement/route layer
  (`src/lib/billing/entitlements.ts` + `plans.ts` for monthly caps,
  `src/lib/billing/priority.ts` + `src/lib/rate-limit.ts` for per-minute
  throttling by `aiPriorityTier`), not inside the gateway. Confirmed pattern
  across `job-gpt` messages and `extension/package` routes. This is the
  right layer for it (the gateway doesn't know which product feature or
  entitlement a call belongs to) — the gap is duplication across call sites,
  not a missing capability.
- Proposed smallest fix for all three: see §3's "Smallest change" block.

# Roles, rate limiting, feature flags audit

**Roles**: `UserRole` enum today is `CANDIDATE | EMPLOYER | COMPANY_ADMIN |
PLATFORM_ADMIN` (`prisma/schema.prisma`). Guards in `src/lib/auth/guards.ts`:
`requireCandidate`, `requirePlatformAdmin`, `requireEmployer` (accepts either
`EMPLOYER` or `COMPANY_ADMIN`), `requireEmployerCompany` (employer + must
have a `CompanyMember` row). Against the roadmap's four target roles
(seeker, referrer, employer, admin):
- **Seeker** ≈ today's `CANDIDATE` — exists.
- **Employer** ≈ today's `EMPLOYER`/`COMPANY_ADMIN` — exists, and is a real,
  working permission model already: `(app)/employer/*` pages and
  `api/employer/*` routes (jobs, jobs/[id], talent, talent/[profileId],
  company, applications, applications/[id]) are live, gated by
  `requireEmployer`/`requireEmployerCompany`, backed by `CompanyMember` with
  its own `OWNER/ADMIN/RECRUITER/MEMBER` sub-roles for team permissions
  within a company.
- **Admin** ≈ today's `PLATFORM_ADMIN` — exists (`requirePlatformAdmin`,
  `(app)/admin`).
- **Referrer** — **does not exist as a role.** No `UserRole` value, no guard,
  no referrer-specific page/API namespace. This is new for Phase 5 and
  should probably be added as a fifth `UserRole` value (`REFERRER`) plus a
  `requireReferrer` guard following the exact shape of the existing four,
  rather than overloading `CANDIDATE` — a referrer isn't necessarily a job
  seeker on the platform.
- The unused fine-grained `Role`/`Permission`/`RolePermission` tables (§4)
  are already schema-present for exactly this kind of expansion but nothing
  reads them yet; adding `REFERRER` to the coarse enum is the smaller, more
  consistent-with-today's-code move and doesn't preclude wiring up the
  fine-grained tables later for in-company permission nuance.

**Rate limiting**: `src/lib/rate-limit.ts` is a real, currently-used
in-memory fixed-window limiter (`Map<key, {count, resetAt}>`), explicitly
documented as "fine for a single-instance deployment... for multi-instance
production, back this with Redis (INCR + EXPIRE) using the same interface" —
i.e. the author already flagged the horizontal-scaling gap in a comment.
Applied today at: auth endpoints (login/signup/forgot-password/
reset-password/verify-email — presumably IP-keyed via `ipFromRequest`),
several `/api/extension/*` routes (connect/poll, pair, package, jobgpt/
generate), and `/api/job-gpt/conversations/[id]/messages`. Combined with
`rateLimitForTier` (`src/lib/billing/priority.ts`) for AI-specific
per-minute throttling by plan tier (standard/priority/highest).

**Feature flags**: confirmed there is **no feature-flag mechanism** anywhere
in the codebase — no `FeatureFlag` model, no flag-reading utility; a repo-wide
case-insensitive search for "feature flag"/"featureflag" turns up nothing
except an unrelated course-lesson filename match
(`prisma/courses/devops-and-ci-cd-fundamentals.ts`, a lesson *about* the
concept, not an implementation of one). This needs to be built from scratch
if the roadmap wants runtime flags — nothing to extend.
