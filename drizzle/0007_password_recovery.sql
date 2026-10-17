CREATE TABLE password_reset_tokens (
 token_hash TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
 password_hash_at_issue TEXT NOT NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 consumption_id TEXT
);
CREATE INDEX password_reset_account ON password_reset_tokens(account_id);
CREATE INDEX password_reset_expiry ON password_reset_tokens(expires_at);
