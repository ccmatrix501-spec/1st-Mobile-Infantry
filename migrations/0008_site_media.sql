create table if not exists site_media (
  id text primary key,
  original_name text not null,
  mime_type text not null,
  data_base64 text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists site_media_created_at_idx
  on site_media (created_at desc);

create table if not exists store_settings (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
