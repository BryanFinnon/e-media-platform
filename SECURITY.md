# Security policy

Report suspected vulnerabilities privately to the E-MEDIA operator instead of publishing customer data or credentials in an issue.

The active application uses salted PBKDF2 password hashes, secure HttpOnly session cookies, server-side administrator roles, project ownership checks, same-origin mutation checks, input validation, database rate limits and audit records. D1 tables and private R2 objects are accessed through server handlers. Legacy Supabase modules are not the active booking account store.

Stripe card details are handled by Stripe. Webhook signatures, stored session metadata, amount, currency and payment status are checked before releasing booking or delivery privileges. Original media cannot be fetched by clients until their verified balance is paid. Previews can still be captured and are not DRM.

Keep provider keys, signing secrets and administrator credential configuration in the hosting secret manager. Do not commit environment files, runtime database exports, customer uploads, cookies or logs containing personal data. Production and Sandbox must use separate credentials and data stores.

Password reset links contain random 256-bit tokens in URL fragments, use a 30-minute expiry and store only SHA-256 digests server-side. Tokens are claimed transactionally once; resetting revokes all sessions and other recovery links without changing account roles. Requests return the same response for known and unknown emails, queue lookups asynchronously, and apply IP/email limits. Initial administrator configuration is a bootstrap credential; after account creation the local password remains authoritative, including after recovery.
