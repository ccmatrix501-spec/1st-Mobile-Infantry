ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS max_selections INTEGER NOT NULL DEFAULT 1;

ALTER TABLE polls
  DROP CONSTRAINT IF EXISTS polls_max_selections_check;

ALTER TABLE polls
  ADD CONSTRAINT polls_max_selections_check
  CHECK (max_selections BETWEEN 1 AND 100);

ALTER TABLE poll_votes
  DROP CONSTRAINT IF EXISTS poll_votes_poll_id_voter_hash_key;

CREATE UNIQUE INDEX IF NOT EXISTS poll_votes_poll_voter_option_idx
  ON poll_votes (poll_id, voter_hash, option_id);

CREATE INDEX IF NOT EXISTS poll_votes_poll_voter_idx
  ON poll_votes (poll_id, voter_hash);
