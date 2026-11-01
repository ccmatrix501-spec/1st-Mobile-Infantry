CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  allow_additions BOOLEAN NOT NULL DEFAULT FALSE,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_user_added BOOLEAN NOT NULL DEFAULT FALSE,
  added_by_hash TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS polls_updated_at_idx
  ON polls (updated_at DESC);

CREATE INDEX IF NOT EXISTS poll_options_poll_idx
  ON poll_options (poll_id, active, sort_order);

CREATE INDEX IF NOT EXISTS poll_votes_poll_idx
  ON poll_votes (poll_id);

CREATE INDEX IF NOT EXISTS poll_votes_option_idx
  ON poll_votes (option_id);

CREATE UNIQUE INDEX IF NOT EXISTS poll_options_active_label_idx
  ON poll_options (poll_id, lower(label))
  WHERE active = TRUE;
