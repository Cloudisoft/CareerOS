# Career OS

Your career. One operating system. Discover, match, apply, interview, learn, and grow — all
connected through one Career Profile.

This is a real, functioning SaaS build-in-progress, not a mockup. See the phase checklist below
for what's implemented vs. planned.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, Framer Motion, Lucide icons
- **Backend:** Next.js Route Handlers (REST), server-only service modules
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** DB-backed sessions (opaque token in an httpOnly cookie, only its hash stored), bcrypt password hashing, email verification, password reset
- **Email:** Provider abstraction — logs to console in development, swaps to Resend when `RESEND_API_KEY` is set
- **AI:** Provider abstraction (added in the AI/Job GPT phase) — never hardcoded to one vendor
- **Billing:** Stripe (added in the billing phase)

## Local development

Prerequisites: Node 20+, pnpm, PostgreSQL running locally.

```bash
cp .env.example .env   # then fill in DATABASE_URL at minimum
pnpm install
pnpm prisma migrate dev
pnpm dev
```

The app runs at http://localhost:3000.

In development, verification and password-reset emails are logged to the server console
(look for `📧 [dev email]`) instead of being sent — no email provider credentials are required
to exercise the full auth flow locally.

## Environment variables

See `.env.example`. Nothing beyond `DATABASE_URL` is required to run the app locally — every
external integration (email, AI, Stripe, Redis) has a documented development fallback and is
clearly disabled/mocked until its credentials are provided.

## Project structure

```
prisma/schema.prisma       Database schema (grows with each phase)
src/app/(marketing)/       Public marketing site
src/app/(auth)/            Login, signup, password reset, email verification
src/app/(app)/             Authenticated candidate/employer app shell
src/app/api/               REST API routes (shared by the web app and the Chrome extension)
src/lib/                   Auth, email, validation, and other server-only services
src/components/ui/         Design-system primitives (Career OS brand tokens)
src/config/nav.ts          Primary navigation — `available: false` items are shipped in later phases
public/brand/              Logo and icon assets derived from the Career OS brand mark
```

## Build phases

- [x] **Phase 1** — Architecture, database schema, auth (signup/login/verify/reset), RBAC scaffold, design system, app shell
- [ ] **Phase 2** — Candidate onboarding, Career Profile, Career Readiness scoring, dashboard
- [ ] **Phase 3** — Jobs marketplace, matching engine, applications
- [ ] **Phase 4** — Resume Studio, ATS Scanner
- [ ] **Phase 5** — Stripe subscriptions & entitlements
- [ ] **Phase 6** — AI gateway & Job GPT
- [ ] **Phase 7** — Career Circles (network, connections, messaging)
- [ ] **Phase 8** — Employer dashboard, company pages, talent search
- [ ] **Phase 9** — Interview AI
- [ ] **Phase 10** — Learning Hub
- [ ] **Phase 11** — Auto Apply engine, adapters, Chrome extension
- [ ] **Phase 12** — Admin, analytics, security hardening, tests, polish
