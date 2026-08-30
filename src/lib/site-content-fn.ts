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

type AccountRow = {
  providerId: string;
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

function envSet(name: string): Set<string> {
  const configured = process.env[name]?.trim() ?? "";
  return new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function requireLeadership(userId: string): Promise<void> {
  if (userId === "dev-user") return;

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const users = await sql.query<UserRow>(
    'select "email" as email from "user" where "id" = $1 limit 1',
    [userId],
  );
  const email = users[0]?.email?.trim().toLowerCase();
  if (!email) throw new Error("Leadership account not found.");

  const allowedUserIds = envSet("LEADERSHIP_USER_IDS");
  if (allowedUserIds.has(userId.toLowerCase())) return;

  const accounts = await sql.query<AccountRow>(
    'select "providerId" as "providerId" from "account" where "userId" = $1',
    [userId],
  );
  const hasFederatedIdentity = accounts.some(
    (account) => account.providerId !== "credential",
  );
  const allowedEmails = envSet("LEADERSHIP_EMAILS");
  if (hasFederatedIdentity && allowedEmails.has(email)) return;

  throw new Error(
    "This account does not have leadership editing access. Add its email to LEADERSHIP_EMAILS (Google/X) or its user ID to LEADERSHIP_USER_IDS (username/password).",
  );
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

export const fetchLeadershipSiteContent = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SiteContent> => {
    await requireLeadership(context.userId);
    return readSiteContent();
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

    return readSiteContent();
  });
