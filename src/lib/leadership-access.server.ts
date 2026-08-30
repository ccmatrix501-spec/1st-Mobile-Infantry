type LeadershipRow = {
  user_id: string;
  username: string;
  is_active: boolean;
  is_super_admin: boolean;
};

type UserRow = {
  id: string;
  email: string;
};

type AccountRow = {
  providerId: string;
};

function envSet(name: string): Set<string> {
  const configured = process.env[name]?.trim() ?? "";
  return new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function usernameFromEmail(email: string): string {
  const base = email.split("@")[0] || "leader";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "leader";
}

export async function getLeadershipAccount(userId: string): Promise<LeadershipRow | null> {
  if (userId === "dev-user") {
    return {
      user_id: "dev-user",
      username: "dev-user",
      is_active: true,
      is_super_admin: true,
    };
  }

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();

  const existing = await sql.query<LeadershipRow>(
    `select user_id, username, is_active, is_super_admin
       from leadership_accounts
      where user_id = $1
      limit 1`,
    [userId],
  );
  if (existing[0]) return existing[0];

  // Preserve the existing environment-variable allowlist for federated users
  // and explicitly allowlisted user IDs. Once accepted, persist the grant in the
  // leadership registry so future checks do not depend on client-side state.
  const users = await sql.query<UserRow>(
    'select "id" as id, "email" as email from "user" where "id" = $1 limit 1',
    [userId],
  );
  const user = users[0];
  if (!user) return null;

  const allowedUserIds = envSet("LEADERSHIP_USER_IDS");
  let allowed = allowedUserIds.has(userId.toLowerCase());

  if (!allowed) {
    const accounts = await sql.query<AccountRow>(
      'select "providerId" as "providerId" from "account" where "userId" = $1',
      [userId],
    );
    const hasFederatedIdentity = accounts.some(
      (account) => account.providerId !== "credential",
    );
    const allowedEmails = envSet("LEADERSHIP_EMAILS");
    allowed = hasFederatedIdentity && allowedEmails.has(user.email.toLowerCase());
  }

  if (!allowed) return null;

  let username = usernameFromEmail(user.email);
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? username : `${username.slice(0, 27)}-${suffix}`;
    try {
      const inserted = await sql.query<LeadershipRow>(
        `insert into leadership_accounts (user_id, username, is_active, is_super_admin)
         values ($1, $2, true, false)
         on conflict (user_id) do update set updated_at = now()
         returning user_id, username, is_active, is_super_admin`,
        [userId, candidate],
      );
      return inserted[0] ?? null;
    } catch {
      // Username collision: try a short numeric suffix.
    }
  }

  return null;
}

export async function requireLeadership(userId: string): Promise<LeadershipRow> {
  const account = await getLeadershipAccount(userId);
  if (!account || !account.is_active) {
    throw new Error("This account does not have active leadership editing access.");
  }
  return account;
}
