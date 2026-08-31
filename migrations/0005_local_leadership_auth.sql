-- First-party local leadership authentication for the website editor.
-- Passwords are stored only as salted scrypt hashes. Sessions live in secure,
-- HTTP-only TanStack Start cookies and are revalidated against this table.
create table if not exists leadership_local_accounts (
  id text primary key,
  username text not null,
  password_hash text not null,
  is_active boolean not null default true,
  is_super_admin boolean not null default false,
  session_version integer not null default 1,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leadership_local_accounts_username_lower_idx
  on leadership_local_accounts ((lower(username)));

create index if not exists leadership_local_accounts_active_idx
  on leadership_local_accounts (is_active);
