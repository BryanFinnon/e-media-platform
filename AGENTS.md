# Repository conventions

## Scope and product truth

- Treat E-MEDIA as a production application, not a static mock-up.
- Never fabricate clients, testimonials, awards, partners, journalistic claims, prices, revenue, VAT status, addresses, legal policy, or events.
- Use clearly labelled development examples and hide empty business-proof sections.
- Use British English and default to `Europe/London` and GBP while keeping stored timestamps in UTC.

## Engineering

- Package manager: pnpm. Runtime: Node 22.
- Next.js App Router and strict TypeScript. Prefer Server Components; add `"use client"` only for browser state or events.
- Keep domain rules pure in `lib/domain`; keep secrets and privileged clients in `lib/server` or server-only modules.
- Validate external input with Zod at every server boundary. Do not use `any` to bypass typing.
- Do not introduce Prisma or NextAuth. The active deployment uses D1, private R2 storage and local email/password sessions; keep legacy Supabase modules separate.
- Every active database change is a forward SQL migration under `drizzle/` with appropriate constraints and indexes. Legacy Supabase migrations remain separate.
- Monetary values are integer minor units. Snapshot commercial terms on bookings and quotes.
- Public route code must render intentionally when optional provider credentials are absent.

## Security

- Never expose service-role, payment, webhook, email, Redis, Mux, or cron secrets to browser code.
- Enforce roles and ownership in server code, not just component visibility.
- D1 tables are server-only. Test high-risk ownership and role rules; apply RLS to any separately enabled Supabase tables.
- Verify Stripe signatures and idempotency before applying payment state.
- Validate uploads by actual MIME/type and size; use private R2 objects and authenticated delivery handlers for private data.
- Avoid sensitive logs. Audit privileged mutations.

## Design and accessibility

- Preserve the supplied black, off-white, slate, and restrained E-MEDIA orange visual system.
- Favour editorial typography, fine grid/border systems, asymmetry, and generous negative space over rounded-card SaaS patterns.
- Keep orange rare and semantic. Avoid excessive gradients, glassmorphism, glow, and animation.
- All layouts work from 320 px to wide desktop without horizontal overflow.
- Meet WCAG 2.2 AA intent: semantic structure, visible focus, keyboard support, labelled controls, sufficient contrast, reduced motion, and useful alternative text.

## Quality

- Add tests with new domain behaviour and regressions.
- Required gates are lint, typecheck, unit/integration tests, Playwright critical flows, and production build.
- Do not mute warnings or disable rules to pass. Fix causes.
- Preserve user changes in a dirty tree; inspect the diff before hand-off.
- Keep provider calls behind adapters and mock them in automated tests; never send real email or take real payment in tests.
