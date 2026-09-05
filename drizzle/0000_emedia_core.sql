CREATE TABLE services (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  booking_mode TEXT NOT NULL DEFAULT 'REQUEST_TO_BOOK',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  service_slug TEXT NOT NULL REFERENCES services(slug),
  service_name TEXT NOT NULL,
  preferred_at TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  brief TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  source TEXT NOT NULL DEFAULT 'WEBSITE',
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX bookings_status_created_idx ON bookings(status, created_at DESC);
CREATE INDEX bookings_email_created_idx ON bookings(client_email, created_at DESC);
CREATE INDEX bookings_preferred_at_idx ON bookings(preferred_at);

CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'SUBSCRIBED' CHECK (status IN ('SUBSCRIBED', 'UNSUBSCRIBED')),
  source TEXT NOT NULL DEFAULT 'WEBSITE',
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  created_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio_items (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  year_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  cover_media_id TEXT REFERENCES media_assets(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX portfolio_published_sort_idx ON portfolio_items(published, sort_order, created_at DESC);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX audit_created_idx ON audit_log(created_at DESC);

CREATE TABLE rate_limits (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key_hash, window_start)
);

INSERT INTO services (id, slug, name, booking_mode) VALUES
  ('svc_photography', 'photography', 'Photography', 'REQUEST_TO_BOOK'),
  ('svc_videography', 'videography', 'Videography', 'QUOTE_REQUIRED'),
  ('svc_film', 'film-production', 'Film production', 'DISCOVERY_CALL'),
  ('svc_podcasts', 'interviews-podcasts', 'Interviews & podcasts', 'REQUEST_TO_BOOK'),
  ('svc_livestream', 'livestream-production', 'Livestream production', 'QUOTE_REQUIRED'),
  ('svc_post', 'post-production', 'Post production', 'REQUEST_TO_BOOK'),
  ('svc_web', 'web-development', 'Web development', 'DISCOVERY_CALL'),
  ('svc_systems', 'business-systems', 'Business systems', 'DISCOVERY_CALL'),
  ('svc_mobile', 'mobile-applications', 'Mobile applications', 'DISCOVERY_CALL'),
  ('svc_ai', 'ai-integration', 'AI integration consulting', 'DISCOVERY_CALL'),
  ('svc_graphic', 'graphic-design', 'Graphic design', 'REQUEST_TO_BOOK'),
  ('svc_content', 'content-support', 'Content creation support', 'REQUEST_TO_BOOK'),
  ('svc_community', 'community-management', 'Community management', 'DISCOVERY_CALL');
