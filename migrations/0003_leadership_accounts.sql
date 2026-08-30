-- Leadership website editor accounts.
-- Authentication remains in Better Auth's user/account/session tables; this table
-- grants website-editing permission and stores the login username alias.
create table if not exists leadership_accounts (
  user_id text primary key references "user" ("id") on delete cascade,
  username text not null,
  is_active boolean not null default true,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leadership_accounts_username_lower_idx
  on leadership_accounts ((lower(username)));

create index if not exists leadership_accounts_active_idx
  on leadership_accounts (is_active);
