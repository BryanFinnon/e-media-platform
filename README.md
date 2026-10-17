# E-MEDIA Platform

E-MEDIA's creative studio website and client portal, from booking requests to private media delivery.

**Website:** [weareemedia.co.uk](https://weareemedia.co.uk) · **Tagline:** Fast content delivery

## Features

- Service catalogue, portfolio, horizontal project gallery, partner and client-feedback management.
- Email/password registration with name, phone and address; private client accounts and administrator roles. Password recovery uses expiring, one-time email links and revokes previous sessions.
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

The latest validated suite contains 129 tests. Browser journey specifications are in `tests/e2e`; the most recent workflow was also checked manually by the project owner in the isolated sandbox.

## Configuration and deployment

Use runtime secrets for `ADMIN_LOGIN_CREDENTIAL`, Stripe keys, webhook signing secrets and Resend credentials. The administrator credential contains a salted PBKDF2 hash, never a plaintext password. See `.env.example` and [payment setup](STRIPE_INTEGRATION_TODO.md).

`.openai/hosting.json` declares the Sites project and logical D1/R2 bindings. Deployment bundles include the forward SQL migrations. The GitHub source mirror does not itself configure hosted secrets or publish a Sites version.

Test payments use a separate site, database, storage and Stripe Sandbox. Never substitute test keys into production or use real cards for sandbox testing.

## Media delivery limits

Large delivery originals, prepared previews and public media support resumable 16 MiB multipart uploads, up to 100 GiB per file. Pending sessions expire after 24 hours; reselect the same unchanged file to resume. Completed uploads remain stored. The existing automatic photo form retains its 25 MB original / 10 MB preview limits and generates previews at a maximum 1600-pixel edge.

Automatic video previews are implemented through Cloudflare Stream but require separate account configuration. Originals up to 30 GB can be copied into Stream with a required watermark profile and signed playback; larger originals need a separately prepared watermarked preview. No Stream subscription is activated by deploying the code. Portfolio videos can be uploaded as web-ready MP4/WebM files and selected separately from the cover image.

Admin → Storage shows registered completed bytes and recent upload sessions. This inventory excludes incomplete multipart storage and Stream usage and is not a provider billing meter. No automatic deletion of delivered originals is enabled. Screenshots cannot be reliably prevented; watermarking protects the preview while originals remain inaccessible until the verified balance payment.


### Automatic video service configuration

Set `CLOUDFLARE_ACCOUNT_ID`, secret `CLOUDFLARE_STREAM_API_TOKEN` (account-scoped Stream edit/read permissions), and `CLOUDFLARE_STREAM_WATERMARK_UID` as runtime environment values. `NEXT_PUBLIC_SITE_URL` must be the correct HTTPS deployment origin. Use a full-frame transparent image containing repeated E-MEDIA preview text as the watermark profile, with centre placement. Confirm the provider subscription, billing and scope on the business account before activation. Test with a non-customer sample first. Never paste keys into repository files.

An expiring, hashed bearer capability lets Stream fetch the private original for encoding; it is revoked when the ready preview is verified. The preview must report both the configured watermark UID and signed-URL protection before attachment. Originals remain private and retain the verified-balance download gate. Stream processing errors leave the original intact and block publication until a valid preview is attached. Browser recordings cannot be reliably blocked.

Multipart validation covers exact chunk size, immutable chunk hashes, file headers/trailers, final object size, session ownership, staff roles, and exact mutation origins. File transfer responses support HTTP byte ranges for video seeking and large downloads. Real multi-gigabyte transfers and live Stream encoding still require end-to-end verification after service connection; unit tests use isolated data and mocked providers.
