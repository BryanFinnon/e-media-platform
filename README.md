# E-MEDIA Platform

E-MEDIA's creative studio website and client portal, from booking requests to private media delivery.

**Website:** [weareemedia.co.uk](https://weareemedia.co.uk) · **Tagline:** Fast content delivery

## Features

- Service catalogue, portfolio, horizontal project gallery, partner and client-feedback management.
- Email/password registration with name, phone and address; private client accounts and administrator roles.
- Availability review and itemised quotes using the service price guide. Time-based packages scale with the agreed duration; image, monthly and fixed-unit services use quantity.
- Stripe embedded Checkout: a verified 50% deposit confirms the booking; the final 50% unlocks originals.
- Batch photo uploads with automatically generated, reduced previews containing repeated E-MEDIA text. Clients can enlarge previews before the balance is paid.
- Private originals protected by server-side ownership and payment checks. MP4/WebM delivery supports separately prepared watermarked previews.
- Booking emails through Resend, calendar exports, newsletter subscriptions and administrative audit records.

## Stack

Next.js 16, React 19, TypeScript, Cloudflare Workers/OpenNext, D1, R2, Stripe, Resend and Zod. Vitest covers domain rules and authenticated routes. Supabase modules remain in the source; the current deployed booking and delivery workflow uses D1/R2 and local account sessions.

## Development

Node.js 22+ and pnpm 11 are required.

```bash
pnpm install --frozen-lockfile
pnpm --dir tooling install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Hosted database and storage bindings are required for account, booking and upload operations. Configure `DB` and `FILES` for a Cloudflare-compatible environment; plain Next.js development does not provision them. Schema migrations are in `drizzle/`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The latest validated suite contains 81 tests. Browser journey specifications are in `tests/e2e`; the most recent workflow was also checked manually by the project owner in the isolated sandbox.

## Configuration and deployment

Use runtime secrets for `ADMIN_LOGIN_CREDENTIAL`, Stripe keys, webhook signing secrets and Resend credentials. The administrator credential contains a salted PBKDF2 hash, never a plaintext password. See `.env.example` and [payment setup](STRIPE_INTEGRATION_TODO.md).

`.openai/hosting.json` declares the Sites project and logical D1/R2 bindings. Deployment bundles include the forward SQL migrations. The GitHub source mirror does not itself configure hosted secrets or publish a Sites version.

Test payments use a separate site, database, storage and Stripe Sandbox. Never substitute test keys into production or use real cards for sandbox testing.

## Media delivery limits

Original files: 25 MB each. Previews: 10 MB each. Photo previews are generated at a maximum 1600-pixel edge. Video watermarking currently requires a prepared preview. Screenshots cannot be reliably prevented; watermarking protects the preview while originals remain inaccessible until the verified balance payment.
