CREATE TABLE homepage_brands (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 relationship TEXT NOT NULL CHECK(relationship IN('Client','Partner')),
 logo_media_id TEXT REFERENCES media_assets(id),
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN(0,1)),
 permission INTEGER NOT NULL DEFAULT 0 CHECK(permission IN(0,1)),
 created_at TEXT NOT NULL,
 CHECK(published=0 OR permission=1)
);
CREATE TABLE homepage_reviews (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 company TEXT NOT NULL DEFAULT '',
 quote TEXT NOT NULL,
 stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN(0,1)),
 permission INTEGER NOT NULL DEFAULT 0 CHECK(permission IN(0,1)),
 created_at TEXT NOT NULL,
 CHECK(published=0 OR permission=1)
);
CREATE INDEX homepage_brands_published ON homepage_brands(published,created_at);
CREATE INDEX homepage_reviews_published ON homepage_reviews(published,created_at);
