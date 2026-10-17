ALTER TABLE bookings ADD COLUMN rate_id TEXT;
ALTER TABLE bookings ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0);
CREATE TABLE booking_quotes (
 booking_id TEXT PRIMARY KEY REFERENCES bookings(id),
 snapshot_json TEXT NOT NULL,
 total_minor INTEGER NOT NULL CHECK(total_minor > 0),
 deposit_minor INTEGER NOT NULL CHECK(deposit_minor > 0),
 balance_minor INTEGER NOT NULL CHECK(balance_minor >= 0),
 deposit_paid INTEGER NOT NULL DEFAULT 0 CHECK(deposit_paid IN(0,1)),
 balance_paid INTEGER NOT NULL DEFAULT 0 CHECK(balance_paid IN(0,1)),
 gallery_ready INTEGER NOT NULL DEFAULT 0 CHECK(gallery_ready IN(0,1)),
 approved_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 approved_by TEXT NOT NULL,
 quote_email_sent_at TEXT,
 CHECK(deposit_minor + balance_minor = total_minor)
);
CREATE TABLE booking_checkout (
 id TEXT PRIMARY KEY,
 booking_id TEXT NOT NULL REFERENCES booking_quotes(booking_id),
 stage TEXT NOT NULL CHECK(stage IN('deposit','balance')),
 stripe_session_id TEXT UNIQUE,
 amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN('pending','paid','expired')),
 created_at TEXT NOT NULL,
 paid_at TEXT
);
CREATE UNIQUE INDEX checkout_one_pending ON booking_checkout(booking_id,stage) WHERE state='pending';
CREATE TABLE booking_deliverables (
 id TEXT PRIMARY KEY,
 booking_id TEXT NOT NULL REFERENCES booking_quotes(booking_id),
 title TEXT NOT NULL,
 filename TEXT NOT NULL,
 mime_type TEXT NOT NULL,
 preview_mime TEXT NOT NULL,
 original_key TEXT NOT NULL UNIQUE,
 preview_key TEXT NOT NULL UNIQUE,
 original_size INTEGER NOT NULL,
 preview_size INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX deliverables_booking ON booking_deliverables(booking_id);
CREATE TABLE checkout_events (id TEXT PRIMARY KEY, processed_at TEXT NOT NULL);
