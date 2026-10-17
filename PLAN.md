# E-MEDIA implementation status

The current source implements the public studio site, email/password client accounts, local administrator credentials, booking requests, availability approval, itemised quotes, 50% deposits, private preview galleries, final-balance download release and email-based account recovery.

## Active architecture

- `app/` and `components/`: Next.js routes and interfaces.
- `lib/domain/`: pure pricing, duration, identity and delivery rules.
- `lib/server/`: D1/R2 access, authentication and provider adapters.
- `lib/client/`: browser-side flattened watermarked photo previews.
- `drizzle/`: forward D1 migrations, included in the deployment bundle.
- `tests/unit/`: automated domain and route regressions.
- `tests/e2e/`: browser journey specifications.

Production and Sandbox are isolated deployments. GitHub mirrors the production application source. Sandbox-only restrictions and test keys are not merged into production.

## Remaining work

- Large-file and resumable video uploads beyond the current 25 MB original limit.
- Automatic video watermark generation.
- Broader end-to-end browser automation for account, payment and media flows.
- Quote replacement, refund and cancellation workflows beyond the current manual review process.

Published commercial quotes remain immutable snapshots. Future changes must preserve private ownership, original-file protection and verified payment fulfilment.
