CREATE TABLE media_uploads (
 id TEXT PRIMARY KEY,
 actor_email TEXT NOT NULL,
 purpose TEXT NOT NULL CHECK(purpose IN('original','preview','public')),
 booking_id TEXT REFERENCES booking_quotes(booking_id),
 filename TEXT NOT NULL,
 mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes>0),
 storage_key TEXT NOT NULL UNIQUE,
 multipart_id TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN('pending','complete','cancelled')),
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 stream_id TEXT,
 stream_host TEXT,
 source_token_hash TEXT,
 source_expires_at TEXT,
 CHECK((purpose='public' AND booking_id IS NULL) OR (purpose!='public' AND booking_id IS NOT NULL))
);
CREATE INDEX media_uploads_actor ON media_uploads(actor_email,created_at);
CREATE TABLE media_upload_parts (
 upload_id TEXT NOT NULL REFERENCES media_uploads(id),
 part_number INTEGER NOT NULL CHECK(part_number>0),
 size_bytes INTEGER NOT NULL,
 checksum TEXT NOT NULL,
 etag TEXT,
 PRIMARY KEY(upload_id,part_number)
);
ALTER TABLE booking_deliverables ADD COLUMN original_upload_id TEXT REFERENCES media_uploads(id);
ALTER TABLE booking_deliverables ADD COLUMN preview_upload_id TEXT REFERENCES media_uploads(id);
CREATE UNIQUE INDEX delivery_original_upload ON booking_deliverables(original_upload_id) WHERE original_upload_id IS NOT NULL;
CREATE UNIQUE INDEX delivery_preview_upload ON booking_deliverables(preview_upload_id) WHERE preview_upload_id IS NOT NULL;
ALTER TABLE media_assets ADD COLUMN upload_id TEXT REFERENCES media_uploads(id);
CREATE UNIQUE INDEX media_asset_upload ON media_assets(upload_id) WHERE upload_id IS NOT NULL;
ALTER TABLE portfolio_items ADD COLUMN video_media_id TEXT REFERENCES media_assets(id);
