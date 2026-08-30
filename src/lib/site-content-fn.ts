import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
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

type UserRow = {
  email: string;
};

function normalizeAllowedEmails(): Set<string> {
  const configured = process.env.LEADERSHIP_EMAILS?.trim() ?? "";
  return new Set(
    configured
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function requireLeadership(userId: string): Promise<void> {
  if (userId === "dev-user") return;

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<UserRow>(
    'select "email" as email from "user" where "id" = $1 limit 1',
    [userId],
  );
  const email = rows[0]?.email?.trim().toLowerCase();
  if (!email) throw new Error("Leadership account not found.");

  const allowed = normalizeAllowedEmails();
  const isLocalLeadership = email.endsWith("@1stmid.local");
  if (!isLocalLeadership && !allowed.has(email)) {
    throw new Error("This account does not have leadership editing access.");
  }
}

export const fetchSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    try {
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
    } catch {
      return mergeSiteContent();
    }
  },
);

export const fetchLeadershipSiteContent = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SiteContent> => {
    await requireLeadership(context.userId);
    return fetchSiteContent();
  });

export const saveSiteContent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((input: Partial<SiteContent>) => input)
  .handler(async ({ data, context }): Promise<SiteContent> => {
    await requireLeadership(context.userId);

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
        [key, value, context.userId],
      );
    }

    return fetchSiteContent();
  });
