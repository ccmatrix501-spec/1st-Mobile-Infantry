-- Track whether the one-time leadership bootstrap credential has been successfully used.
-- Until finalized, the bootstrap secret may repair the initial credential row.
alter table leadership_accounts
  add column if not exists bootstrap_finalized boolean not null default false;
