# Security policy

Report suspected vulnerabilities privately to the E-MEDIA operator instead of publishing customer data or credentials in an issue.

The active application uses salted PBKDF2 password hashes, secure HttpOnly session cookies, server-side administrator roles, project ownership checks, same-origin mutation checks, input validation, database rate limits and audit records. D1 tables and private R2 objects are accessed through server handlers. Legacy Supabase modules are not the active booking account store.

Stripe card details are handled by Stripe. Webhook signatures, stored session metadata, amount, currency and payment status are checked before releasing booking or delivery privileges. Original media cannot be fetched by clients until their verified balance is paid. Previews can still be captured and are not DRM.

Keep provider keys, signing secrets and administrator credential configuration in the hosting secret manager. Do not commit environment files, runtime database exports, customer uploads, cookies or logs containing personal data. Production and Sandbox must use separate credentials and data stores.

Password reset links contain random 256-bit tokens in URL fragments, use a 30-minute expiry and store only SHA-256 digests server-side. Tokens are claimed transactionally once; resetting revokes all sessions and other recovery links without changing account roles. Requests return the same response for known and unknown emails, queue lookups asynchronously, and apply IP/email limits. Initial administrator configuration is a bootstrap credential; after account creation the local password remains authoritative, including after recovery.

## Large file transfers

Only administrators can create or mutate upload sessions; each session is bound to its initiating administrator and, for deliveries, to a booking. Requests require an exact same-origin header. Chunks are bounded to 16 MiB and receive immutable SHA-256 digests. Completion checks every part, stored size and media signatures; guessed IDs cannot expose R2 keys or raw data. Completed file attachment has unique source-upload constraints for idempotency. Pending cancellation cannot remove completed or attached files.

Stream is optional and disabled without explicit runtime configuration. Its copy source uses a 256-bit bearer capability with only a hash stored, a 24-hour expiry and revocation after successful preview validation. Do not record full source URLs in telemetry. Private video playback is issued only after existing gallery ownership and payment-stage checks, using signed provider tokens without enabling downloads. Never treat a hidden download button as access control.
