import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_STORE_SETTINGS,
  mergeStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";

type StoreRow = { config: StoreSettings | string };

async function readStoredSettings(): Promise<StoreSettings> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<StoreRow>(
    "select config from store_settings where id = 'main' limit 1",
  );
  const raw = rows[0]?.config;
  if (!raw) return mergeStoreSettings();
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as StoreSettings) : raw;
  return mergeStoreSettings(parsed);
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

function validImageUrl(value: string): boolean {
  if (!value) return true;
  return value.startsWith("/") || /^https:\/\//i.test(value);
}

function validBuyUrl(value: string): boolean {
  if (!value) return true;
  return /^https:\/\//i.test(value);
}

function validateSettings(input: StoreSettings): StoreSettings {
  const settings = mergeStoreSettings(input);
  const json = JSON.stringify(settings);
  if (json.length > 1_000_000) {
    throw new Error("Store settings are too large. Keep product images in the Media Library instead of embedding them.");
  }
  if (settings.title.length > 160 || settings.kicker.length > 80) {
    throw new Error("Store title or kicker is too long.");
  }
  if (settings.body.length > 4_000 || settings.statusText.length > 2_000) {
    throw new Error("Store page text is too long.");
  }
  if (!validImageUrl(settings.heroImage)) {
    throw new Error("Store hero image must use a site path or HTTPS URL.");
  }
  if (!Array.isArray(settings.products) || settings.products.length > 100) {
    throw new Error("Store can contain up to 100 products.");
  }

  const seen = new Set<string>();
  for (const product of settings.products) {
    if (!product.id || seen.has(product.id)) throw new Error("Each product must have a unique id.");
    seen.add(product.id);
    if (!product.name.trim() || product.name.length > 180) throw new Error("Each product needs a valid name.");
    if (product.description.length > 4_000) throw new Error(`Description is too long for ${product.name}.`);
    if (product.price.length > 40 || product.currency.length > 8) throw new Error(`Price is invalid for ${product.name}.`);
    if (product.category.length > 100 || product.stockStatus.length > 120) throw new Error(`Category or stock status is too long for ${product.name}.`);
    if (!validImageUrl(product.image)) throw new Error(`Image URL is invalid for ${product.name}.`);
    if (!validBuyUrl(product.buyUrl)) throw new Error(`Purchase link for ${product.name} must use HTTPS.`);
  }
  return settings;
}

export const fetchPublicStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    try {
      const settings = await readStoredSettings();
      // Do not expose unpublished products/settings through the public settings endpoint.
      return settings.enabled ? settings : { ...DEFAULT_STORE_SETTINGS };
    } catch {
      return mergeStoreSettings();
    }
  },
);

export const fetchLeadershipStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    try {
      return await readStoredSettings();
    } catch {
      return mergeStoreSettings();
    }
  },
);

export const saveLeadershipStoreSettings = createServerFn({ method: "POST" })
  .inputValidator((input: StoreSettings) => input)
  .handler(async ({ data }): Promise<StoreSettings> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const profile = await requireLocalLeadership();
    const settings = validateSettings(data);
    const sql = await ensureStoreSettingsTable();

    await sql.query(
      `insert into store_settings (id, config, updated_at, updated_by)
       values ('main', $1::jsonb, now(), $2)
       on conflict (id) do update
       set config = excluded.config,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      [JSON.stringify(settings), profile.id],
    );

    return settings;
  });

export type StorePageAccess = {
  visible: boolean;
  leadershipPreview: boolean;
  settings: StoreSettings;
};

export const fetchStorePageAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<StorePageAccess> => {
    let settings = mergeStoreSettings();
    try {
      settings = await readStoredSettings();
    } catch {
      // First run / migration timing: hidden Store is the safe default.
    }

    if (settings.enabled) {
      return { visible: true, leadershipPreview: false, settings };
    }

    try {
      const { getLocalLeadershipProfile } = await import("@/lib/local-leadership-access.server");
      const profile = await getLocalLeadershipProfile();
      if (profile) {
        return { visible: true, leadershipPreview: true, settings };
      }
    } catch {
      // Public visitors should not learn private Store configuration.
    }

    return {
      visible: false,
      leadershipPreview: false,
      settings: { ...DEFAULT_STORE_SETTINGS },
    };
  },
);
