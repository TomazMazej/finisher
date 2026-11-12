-- Pošiljanje povezave do načrta po emailu: števec in čas zadnjega pošiljanja (omejitev zlorab).
ALTER TABLE orders ADD COLUMN link_sends INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN link_sent_at TEXT;
