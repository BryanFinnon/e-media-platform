# Payments and private delivery

## Configuration

Set these runtime values through the hosting secret manager:

- `STRIPE_SECRET_KEY`: restricted server key with the permissions needed for Checkout and inline prices.
- `STRIPE_PUBLISHABLE_KEY`: matching client key, returned only when opening Checkout.
- `STRIPE_WEBHOOK_SECRET`: signing secret for this environment's destination.
- `NEXT_PUBLIC_SITE_URL`: deployed site origin.
- `ADMIN_EMAILS` and `ADMIN_LOGIN_CREDENTIAL`: administrator allowlist and salted login credential.
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` and `BOOKING_NOTIFICATION_EMAIL`: optional transactional email configuration.

Never commit actual values. Production and Sandbox use separate Sites projects, databases, file storage, keys and webhook destinations. Deploy after runtime configuration changes.

Checkout uses `ui_mode: embedded_page`, Stripe.js v3 `initEmbeddedCheckout`, API version `2026-08-26.dahlia` and the SDK fetch HTTP client for Workers. The destination `/api/stripe/webhook` receives `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

## Booking lifecycle

1. A client signs up or logs in and requests a service, date and duration.
2. Staff approve availability and publish an immutable quote. Time-based quantities derive from duration; other units use the entered quantity. Optional costs and priority delivery are itemised.
3. A verified 50% deposit changes the booking from `CONTACTED` to `CONFIRMED`.
4. Staff upload original photos. The upload interface generates reduced JPEG previews with repeated E-MEDIA text and publishes the gallery. Videos require a separate prepared preview.
5. Clients review previews before paying the final 50%. Server-side checks prevent access to original bytes before verified payment.
6. Final payment unlocks clean inline viewing and original downloads.

Quotes expire after seven days or at the preferred start time, whichever is earlier. Published quotes are not automatically repriced. Original and preview limits are 25 MB and 10 MB per file.

## Validation

- Automated tests cover pricing across service categories, private ownership, payment/download gates and webhook signatures.
- The owner completed the Sandbox booking/payment/gallery workflow before the latest pricing and automatic-preview refinements.
- Stripe-to-Sandbox webhook delivery was verified with HTTP 200. Each new release still needs an interactive check of the affected flow.
- In Sandbox only: `4242 4242 4242 4242`, a future expiry and any three-digit CVC. No real card is required.
- Sandbox emails are intentionally unconfigured; clients inspect their account directly.

References: [Checkout](https://docs.stripe.com/payments/checkout), [webhooks](https://docs.stripe.com/webhooks), [testing](https://docs.stripe.com/testing).
