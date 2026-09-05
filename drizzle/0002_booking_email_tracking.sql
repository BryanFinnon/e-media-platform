ALTER TABLE bookings ADD COLUMN client_request_email_sent_at TEXT;
ALTER TABLE bookings ADD COLUMN team_request_email_sent_at TEXT;
ALTER TABLE bookings ADD COLUMN client_confirmation_email_sent_at TEXT;

PRAGMA optimize;
