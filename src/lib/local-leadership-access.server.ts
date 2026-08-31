import { useLeadershipSession } from "@/lib/leadership-session.server";

type LocalLeadershipRow = {
  id: string;
  username: string;
  is_active: boolean;
  is_super_admin: boolean;
};

export type LocalLeadershipProfile = {
  id: string;
  username: string;
  isSuperAdmin: boolean;
};

export async function getLocalLeadershipProfile(): Promise<LocalLeadershipProfile | null> {
  const session = await useLeadershipSession();
  const accountId = session.data.accountId;
  if (!accountId) return null;

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<LocalLeadershipRow>(
    `select id, username, is_active, is_super_admin
       from leadership_local_accounts
      where id = $1
      limit 1`,
    [accountId],
  );
  const row = rows[0];
  if (!row || !row.is_active) {
    await session.clear();
    return null;
  }

  if (
    session.data.username !== row.username ||
    session.data.isSuperAdmin !== row.is_super_admin
  ) {
    await session.update({
      accountId: row.id,
      username: row.username,
      isSuperAdmin: row.is_super_admin,
    });
  }

  return {
    id: row.id,
    username: row.username,
    isSuperAdmin: row.is_super_admin,
  };
}

export async function requireLocalLeadership(): Promise<LocalLeadershipProfile> {
  const profile = await getLocalLeadershipProfile();
  if (!profile) {
    throw new Error("Leadership session expired. Sign in again.");
  }
  return profile;
}
