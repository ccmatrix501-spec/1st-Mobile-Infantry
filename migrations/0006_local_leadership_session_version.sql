-- Ensure local leadership sessions can be invalidated after password changes,
-- even if an earlier deployment already applied 0005 before session_version was added.
alter table leadership_local_accounts
  add column if not exists session_version integer not null default 1;
