create table if not exists store_orders (
  id text primary key,
  order_number text not null unique,
  status text not null default 'paid',
  currency text not null,
  subtotal numeric(12, 2) not null,
  shipping_amount numeric(12, 2) not null,
  total numeric(12, 2) not null,
  shipping_method text not null,
  customer jsonb not null,
  shipping_address jsonb not null,
  items jsonb not null,
  payment_provider text not null,
  payment_reference text not null,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  discord_notified boolean not null default false,
  discord_notified_at timestamptz,
  discord_error text
);

create unique index if not exists store_orders_payment_reference_idx
  on store_orders (payment_provider, payment_reference);

create index if not exists store_orders_placed_at_idx
  on store_orders (placed_at desc);

create index if not exists store_orders_status_idx
  on store_orders (status, placed_at desc);
