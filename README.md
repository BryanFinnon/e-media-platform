# E-MEDIA Platform

[![Quality checks](https://github.com/BryanFinnon/e-media-platform/actions/workflows/quality.yml/badge.svg)](https://github.com/BryanFinnon/e-media-platform/actions/workflows/quality.yml)

A production-oriented platform for E-MEDIA's creative and technology services, covering service discovery, portfolio publishing, bookings and client administration.

**Project site:** [weareemedia.co.uk](https://weareemedia.co.uk)

## Key capabilities

- Structured catalogue for photography, video, digital and branding services
- Service packages, add-ons, availability and booking requests
- Portfolio and media publishing workflows
- Client account and administration areas
- Booking status management, reminders and calendar integration
- Newsletter subscriptions and optional Stripe payment flows
- Feature-controlled media hub and community modules

## Technology

- **Application:** Next.js 16, React 19, TypeScript
- **Data and authentication:** Supabase
- **Validation and utilities:** Zod, date-fns
- **Integrations:** Resend, Stripe, Upstash
- **Deployment:** Cloudflare Workers via OpenNext
- **Quality:** ESLint, TypeScript, Vitest, Playwright, GitHub Actions

## Local development

Requirements: Node.js 22+ and pnpm 11.21.0.

```bash
git clone https://github.com/BryanFinnon/e-media-platform.git
cd e-media-platform
pnpm install --frozen-lockfile
pnpm --dir tooling install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The CI workflow runs linting, type checking, the current 35-unit-test suite and a production build on pushes and pull requests.

## Configuration

The repository includes a safe `.env.example`. Production credentials for Supabase, email, payments and other integrations must be configured through the deployment environment and must never be committed.

## Project status

The core website, service catalogue, portfolio and booking architecture are implemented. Payment, media and community capabilities remain feature-controlled while the platform is expanded.
