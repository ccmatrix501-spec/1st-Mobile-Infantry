-- Editable public website content managed by authenticated leadership.
create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by text references "user" ("id") on delete set null
);

create index if not exists site_content_updated_at_idx on site_content (updated_at desc);
