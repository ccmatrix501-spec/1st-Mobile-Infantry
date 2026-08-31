create table if not exists site_admin_config (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
