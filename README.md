# E-MEDIA platform

The production web platform for [E-MEDIA](https://weareemedia.co.uk/), a London creative studio, technology agency and independent media platform.

This repository is a standalone source snapshot for engineering and portfolio purposes. Its deployment metadata is intentionally not linked to the live production project, so cloning or building this repository cannot update the current website.

## Product capabilities

- Editorial public website and service catalogue
- Four-step project and booking request flow
- Transactional booking notifications
- Newsletter subscriptions with consent tracking
- Client account area
- Media library and portfolio publishing
- Protected operations dashboard
- Audit history and database-backed rate limiting

## Technical stack

- Next.js App Router and React Server Components
- Strict TypeScript
- Cloudflare Workers-compatible server build
- D1-compatible SQL migrations
- R2-compatible object storage
- Zod validation at server boundaries
- Vitest, Playwright and ESLint quality tooling

## Local development

Requirements: Node.js 22 or later and pnpm 11.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

The public pages render without production credentials. Data mutations, uploads and protected areas require compatible local bindings or an appropriately configured hosting environment.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

End-to-end tests can be run separately with:

```bash
pnpm test:e2e
```

## Data and deployment

The `drizzle/` directory contains the current production-oriented database migrations. The legacy `supabase/` schema is retained as part of the platform's implementation history and portability work.

Secrets must remain in local or hosted environment configuration. Only variable names and safe development defaults belong in `.env.example`.

## Status

This repository represents the v0 production foundation. Payments remain intentionally disabled; commercial payment collection is handled outside the application.
