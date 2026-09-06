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

function validateSettings(input: StoreSettings): StoreSettings {
  const settings = mergeStoreSettings(input);
  const json = JSON.stringify(settings);
  if (json.length > 250_000) {
    throw new Error("Store settings are too large. Use a public image path or HTTPS image URL.");
  }
  if (settings.title.length > 160 || settings.kicker.length > 80) {
    throw new Error("Store title or kicker is too long.");
  }
  if (settings.body.length > 4_000 || settings.statusText.length > 2_000) {
    throw new Error("Store page text is too long.");
  }
  return settings;
}

export const fetchPublicStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    try {
      return await readStoredSettings();
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
      // Missing table / first run is the normal hidden-store state.
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
