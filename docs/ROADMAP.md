# CareerOS web app — phased build tracker

Working phase by phase, reusing existing code (Auto Apply, Resume Studio, Interview AI,
Career Profile) wherever it already covers a requirement rather than rebuilding it.
Each item is implemented and tested before being ticked. Anything touching payments,
consent, data deletion, or a production database migration stops for explicit
confirmation before it's built or deployed — this repo's `web` service auto-deploys
this branch straight to production, so a schema change here isn't hypothetical.

## Phase 0 — Foundations

- [x] Audit repo → `docs/ARCHITECTURE.md`
- [ ] DB tables: `job`, `company`, `interview_session`, `toolkit_output`, `bounty`, `referral`, `payout`
  - `Job`, `Company`, `InterviewSession` already exist and are in real use — see `docs/ARCHITECTURE.md`.
  - `ToolkitOutput`, `Bounty`, `Referral`, `Payout` don't exist. Proposed Prisma models are written up
    in `docs/ARCHITECTURE.md` — **awaiting user confirmation before any migration is created or applied**,
    since `Bounty`/`Referral`/`Payout` sit inside the payments + consent gates, and every schema change
    on this branch is a live production migration.
- [ ] LLM gateway: fast/deep model tiers, streaming, per-user usage limits
  - Fast/deep tiers: not implemented (one fixed model per provider, not per-call).
  - Streaming: not implemented at all.
  - Per-user usage limits: real, but enforced per-call-site via billing entitlements + rate-limit,
    not inside the gateway — duplicated logic, right layer. Smallest-fix proposal in `docs/ARCHITECTURE.md`.
- [ ] Roles (seeker, referrer, employer, admin), rate limiting, feature flags
  - Roles: `CANDIDATE`/`EMPLOYER`/`COMPANY_ADMIN`/`PLATFORM_ADMIN` already exist and are enforced by
    real guards. `REFERRER` does not exist — needs a `UserRole` enum addition (a migration) for Phase 5.
  - Rate limiting: a real in-memory limiter exists and is used; its own comment already flags it needs
    Redis backing for multi-instance production (pre-existing known gap, not new).
  - Feature flags: don't exist at all — nothing to reuse, would be built from scratch (a new table = a migration).

## Phase 1 — Opportunities (job board)

- [ ] Ingest jobs from Adzuna + JSearch + employer posts; dedupe; AI-classify level/remote/type
- [ ] Search API with filters (location, remote, level, salary, date)
- [ ] Pages: `/jobs`, `/internships`, `/entry-level`, `/experienced`, `/remote`, `/companies`
- [ ] Job + company detail pages with SEO schema and sitemap
- [ ] Save job, add to Auto Apply, job alerts

## Phase 2 — AI Toolkit

- [ ] Cover Letter, Email, Question Response, Resume Review generators
- [ ] All pull from Career Profile; never invent facts
- [ ] Free limit for logged-out users (3/day), then sign-up

## Phase 3 — Interview AI (practice)

- [ ] Questions generated from job description + profile
- [ ] Voice interview: speech-to-text → AI interviewer → text-to-speech
- [ ] Score each answer (relevance, STAR, clarity) + improved answer
- [ ] Dashboard of sessions and weak topics

## Phase 4 — Live Copilot

**Confirm with the user before starting.**

- [ ] Chrome extension: capture call audio (Meet/Zoom/Teams), visible overlay, consent prompt
- [ ] Realtime service: live transcript → detect question → AI hint in < 1 second
- [ ] Save transcript + post-call score

## Phase 5 — Earn (referral bounties)

- [ ] Employer: post bounty, fund escrow, review referrals, update stages
- [ ] Referrer: bounty board, refer form with endorsement, tracker
- [ ] Candidate consent email before employer sees referral
- [ ] Payouts: per interview + per hire after guarantee period

## Phase 6 — Launch

- [ ] Encryption, data retention, export/delete account
- [ ] Tests: unit, AI output checks, end-to-end flows
- [ ] Privacy policy + referral terms updated; staged rollout

## Gates — stop and ask before

- Anything touching **payments** (bounty escrow, payouts)
- Anything touching **consent** (referral consent email, Live Copilot consent prompt)
- Anything touching **data deletion** (account export/delete)
- Any **production database migration** (this branch auto-deploys — a bad migration
  has already caused a real outage once this session; schema changes get proposed
  and confirmed before the migration file is created and pushed)
