import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_STORE_RETURN_ADDRESS,
  mergeStoreReturnAddress,
  type StoreReturnAddress,
} from "@/lib/store-return-address";

type ReturnAddressRow = { config: StoreReturnAddress | string };

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

async function ensureStoreSettingsTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_settings (
      id text primary key,
      config jsonb not null,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `);
  return sql;
}

function validateReturnAddress(input: StoreReturnAddress): StoreReturnAddress {
  const value = mergeStoreReturnAddress(input);
  const fields = [
    ["Name / business", value.name, 160],
    ["Street address", value.address, 220],
    ["City / suburb", value.city, 120],
    ["State", value.state, 80],
    ["Postcode", value.postalCode, 40],
    ["Country", value.country, 100],
  ] as const;

  for (const [label, text, max] of fields) {
    if (text.length > max) throw new Error(`${label} is too long.`);
  }
  if (!value.name || !value.address || !value.city || !value.postalCode || !value.country) {
    throw new Error("Complete the return name, street address, suburb/city, postcode and country.");
  }
  return value;
}

export const fetchLeadershipStoreReturnAddress = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreReturnAddress> => {
    await requireLeadership();
    try {
      const sql = await ensureStoreSettingsTable();
      const rows = await sql.query<ReturnAddressRow>(
        "select config from store_settings where id = 'return-address' limit 1",
      );
      const raw = rows[0]?.config;
      if (!raw) return { ...DEFAULT_STORE_RETURN_ADDRESS };
      const parsed =
        typeof raw === "string" ? (JSON.parse(raw) as StoreReturnAddress) : raw;
      return mergeStoreReturnAddress(parsed);
    } catch {
      return { ...DEFAULT_STORE_RETURN_ADDRESS };
    }
  },
);

export const saveLeadershipStoreReturnAddress = createServerFn({ method: "POST" })
  .inputValidator((input: StoreReturnAddress) => input)
  .handler(async ({ data }): Promise<StoreReturnAddress> => {
    const profile = await requireLeadership();
    const value = validateReturnAddress(data);
    const sql = await ensureStoreSettingsTable();

    await sql.query(
      `insert into store_settings (id, config, updated_at, updated_by)
       values ('return-address', $1::jsonb, now(), $2)
       on conflict (id) do update
       set config = excluded.config,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      [JSON.stringify(value), profile.id],
    );

    return value;
  });
