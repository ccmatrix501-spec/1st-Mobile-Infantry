import { createServerFn } from "@tanstack/react-start";
import {
  mergeSiteAdminConfig,
  type SiteAdminConfig,
} from "@/lib/site-admin-config";

type ConfigRow = { config: SiteAdminConfig | string };

async function readStoredConfig(): Promise<SiteAdminConfig> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<ConfigRow>(
    "select config from site_admin_config where id = 'main' limit 1",
  );
  const raw = rows[0]?.config;
  if (!raw) return mergeSiteAdminConfig();
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as SiteAdminConfig) : raw;
  return mergeSiteAdminConfig(parsed);
}

function validateConfig(config: SiteAdminConfig): SiteAdminConfig {
  const json = JSON.stringify(config);
  if (json.length > 2_500_000) {
    throw new Error("Site configuration is too large. Use image URLs or public file paths instead of very large embedded images.");
  }
  if (!Array.isArray(config.companies) || config.companies.length < 1 || config.companies.length > 20) {
    throw new Error("Companies must contain between 1 and 20 entries.");
  }
  if (!Array.isArray(config.leadership) || config.leadership.length > 100) {
    throw new Error("Leadership list is invalid.");
  }
  if (!Array.isArray(config.rules.items) || config.rules.items.length > 100) {
    throw new Error("Rules list is invalid.");
  }
  if (!Array.isArray(config.standingOrders) || config.standingOrders.length > 100) {
    throw new Error("Standing Orders list is invalid.");
  }
  return mergeSiteAdminConfig(config);
}

export const fetchPublicSiteAdminConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteAdminConfig> => {
    try {
      return await readStoredConfig();
    } catch {
      return mergeSiteAdminConfig();
    }
  },
);

export const fetchLeadershipSiteAdminConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteAdminConfig> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    return readStoredConfig();
  },
);

export const saveLeadershipSiteAdminConfig = createServerFn({ method: "POST" })
  .inputValidator((input: SiteAdminConfig) => input)
  .handler(async ({ data }): Promise<SiteAdminConfig> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const profile = await requireLocalLeadership();
    const config = validateConfig(data);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    await sql.query(
      `insert into site_admin_config (id, config, updated_at, updated_by)
       values ('main', $1::jsonb, now(), $2)
       on conflict (id) do update
       set config = excluded.config,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      [JSON.stringify(config), profile.id],
    );

    return config;
  });
