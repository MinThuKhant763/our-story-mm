ALTER TABLE profiles ADD COLUMN opening_notifications INTEGER NOT NULL DEFAULT 0 CHECK(opening_notifications IN (0,1));
CREATE TABLE gift_openings (
 gift_id TEXT PRIMARY KEY REFERENCES gifts(id) ON DELETE CASCADE,
 opened_at INTEGER NOT NULL, read_at INTEGER,
 email_status TEXT NOT NULL CHECK(email_status IN ('disabled','pending','sent','review','cancelled')),
 payload TEXT, attempts INTEGER NOT NULL DEFAULT 0,
 first_attempt_at INTEGER, next_attempt_at INTEGER NOT NULL DEFAULT 0,
 sent_at INTEGER, provider_id TEXT
);
CREATE INDEX gift_openings_unread ON gift_openings(read_at,opened_at);
