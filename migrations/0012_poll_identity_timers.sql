ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS require_discord_name BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS poll_voters (
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  discord_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS polls_closes_at_idx
  ON polls (closes_at)
  WHERE closes_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS poll_voters_updated_idx
  ON poll_voters (poll_id, updated_at DESC);
