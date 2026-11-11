-- Naročila. Načrt se ne shranjuje: ustvari se iz vhodnih podatkov, ko ga kupec odpre.
CREATE TABLE orders (
  id            TEXT PRIMARY KEY,              -- naključen ID (base64url), del podpisanega žetona
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  email         TEXT,                          -- izpolni webhook plačilnega posrednika
  lang          TEXT NOT NULL CHECK (lang IN ('sl', 'en')),
  input_json    TEXT NOT NULL,                 -- PlanInput brez "today"
  plan_start    TEXT NOT NULL,                 -- YYYY-MM-DD, datum nakupa = začetek načrta
  ref_code      TEXT REFERENCES ref_codes(code),
  provider      TEXT,                          -- npr. 'lemonsqueezy'
  provider_id   TEXT UNIQUE,                   -- ID naročila pri posredniku (idempotentni webhook)
  amount_cents  INTEGER,
  currency      TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  paid_at       TEXT
);
CREATE INDEX orders_status ON orders(status);
CREATE INDEX orders_ref ON orders(ref_code);

-- Kljukice na strani "moj načrt". item: npr. 'w3s2' (teden 3, tek 2) ali 'check:5'.
CREATE TABLE progress (
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item        TEXT NOT NULL,
  done        INTEGER NOT NULL DEFAULT 1 CHECK (done IN (0, 1)),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (order_id, item)
);

-- Referenčne kode za ustvarjalce.
CREATE TABLE ref_codes (
  code        TEXT PRIMARY KEY,                -- velike črke, npr. 'MAJA'
  owner       TEXT NOT NULL,
  share_pct   INTEGER NOT NULL CHECK (share_pct BETWEEN 0 AND 100),
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Lijak brez piškotkov: samo ime koraka, jezik, razdalja in koda. Brez IP in brez identifikatorja obiskovalca.
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL CHECK (name IN ('preview', 'checkout', 'paid', 'plan_open')),
  lang        TEXT,
  distance    TEXT,
  ref_code    TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX events_name_time ON events(name, created_at);
