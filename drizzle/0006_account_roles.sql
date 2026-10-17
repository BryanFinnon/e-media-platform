ALTER TABLE client_accounts ADD COLUMN role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client','admin'));
