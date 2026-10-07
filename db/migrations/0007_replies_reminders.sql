ALTER TABLE profiles ADD COLUMN renewal_reminders INTEGER NOT NULL DEFAULT 0 CHECK (renewal_reminders IN (0,1));
CREATE TABLE recipient_replies (
 id TEXT PRIMARY KEY, gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
 request_id TEXT NOT NULL, sender_name TEXT NOT NULL, message TEXT NOT NULL,
 created_at INTEGER NOT NULL, read_at INTEGER, UNIQUE(gift_id,request_id)
);
CREATE INDEX recipient_replies_gift ON recipient_replies(gift_id,created_at);
CREATE TABLE reminder_deliveries (
 id TEXT PRIMARY KEY, gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL, days INTEGER NOT NULL CHECK(days IN (1,7)),
 payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','sent','review','cancelled')),
 attempts INTEGER NOT NULL DEFAULT 0, first_attempt_at INTEGER, last_attempt_at INTEGER,
 next_attempt_at INTEGER NOT NULL DEFAULT 0, sent_at INTEGER, provider_id TEXT,
 UNIQUE(gift_id,expires_at,days)
);
CREATE TABLE job_leases (id TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at INTEGER NOT NULL);
