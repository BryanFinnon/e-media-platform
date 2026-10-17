CREATE TABLE client_accounts (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 full_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 address TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 consent_at TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE client_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX client_sessions_account ON client_sessions(account_id);
CREATE INDEX client_sessions_expiry ON client_sessions(expires_at);
ALTER TABLE bookings ADD COLUMN client_account_id TEXT REFERENCES client_accounts(id);
CREATE INDEX bookings_client_account ON bookings(client_account_id,created_at);
