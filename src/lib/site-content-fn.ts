import { createServerFn } from "@tanstack/react-start";
import {
  mergeSiteContent,
  SITE_CONTENT_KEYS,
  type SiteContent,
  type SiteContentKey,
} from "@/lib/site-content";

type SiteContentRow = {
  key: string;
  value: string;
};

async function readSiteContent(): Promise<SiteContent> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<SiteContentRow>(
    "select key, value from site_content",
  );
  const values: Partial<Record<SiteContentKey, string>> = {};
  for (const row of rows) {
    if ((SITE_CONTENT_KEYS as string[]).includes(row.key)) {
      values[row.key as SiteContentKey] = row.value;
    }
  }
  return mergeSiteContent(values);
}

export const fetchSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    try {
      return await readSiteContent();
    } catch {
      return mergeSiteContent();
    }
  },
);

export const fetchLeadershipSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    const { requireLocalLeadership } = await import(
      "@/lib/local-leadership-access.server"
    );
    await requireLocalLeadership();
    return readSiteContent();
  },
);

export const saveSiteContent = createServerFn({ method: "POST" })
  .inputValidator((input: Partial<SiteContent>) => input)
  .handler(async ({ data }): Promise<SiteContent> => {
    const { requireLocalLeadership } = await import(
      "@/lib/local-leadership-access.server"
    );
    const leadership = await requireLocalLeadership();

    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    for (const key of SITE_CONTENT_KEYS) {
      if (!(key in data)) continue;
      const raw = data[key];
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (!value) throw new Error(`${key} cannot be empty.`);
      if (value.length > 2000) throw new Error(`${key} is too long.`);

      await sql.query(
        `insert into site_content (key, value, updated_at, updated_by)
         values ($1, $2, now(), $3)
         on conflict (key) do update
         set value = excluded.value,
             updated_at = excluded.updated_at,
             updated_by = excluded.updated_by`,
        [key, value, leadership.id],
      );
    }

    return readSiteContent();
  });
