import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";

type LocalAccountRow = {
  id: string;
  username: string;
  password_hash: string;
  is_active: boolean;
  is_super_admin: boolean;
  session_version: number;
  failed_attempts: number;
  locked_until: Date | string | null;
};

export type LeadershipLocalProfile = {
  id: string;
  username: string;
  isSuperAdmin: boolean;
};

type LoginResult = {
  ok: boolean;
  error?: string;
};

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

function validateUsername(raw: string): string {
  const username = normalizeUsername(raw);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error(
      "Username must be 3–32 characters and use only letters, numbers, dots, underscores, or hyphens.",
    );
  }
  return username;
}

async function ensureBootstrapAccount(): Promise<LocalAccountRow> {
  const { getSql } = await import("@/lib/db");
  const { hashLeadershipPassword } = await import("@/lib/leadership-password.server");
  const sql = await getSql();

  const existing = await sql.query<LocalAccountRow>(
    `select id, username, password_hash, is_active, is_super_admin,
            session_version, failed_attempts, locked_until
       from leadership_local_accounts
      where is_super_admin = true
      order by created_at asc
      limit 1`,
  );
  if (existing[0]) return existing[0];

  const username = validateUsername(
    process.env.LEADERSHIP_BOOTSTRAP_USERNAME?.trim() || "1stadmin",
  );
  const password = process.env.LEADERSHIP_BOOTSTRAP_PASSWORD?.trim();
  if (!password || password.length < 8 || password.length > 128) {
    throw new Error(
      "Initial leadership password is missing or invalid. Check LEADERSHIP_BOOTSTRAP_PASSWORD in Vercel and redeploy.",
    );
  }

  const passwordHash = await hashLeadershipPassword(password);
  const id = randomUUID();

  try {
    const inserted = await sql.query<LocalAccountRow>(
      `insert into leadership_local_accounts
         (id, username, password_hash, is_active, is_super_admin,
          session_version, failed_attempts, created_at, updated_at)
       values ($1, $2, $3, true, true, 1, 0, now(), now())
       returning id, username, password_hash, is_active, is_super_admin,
                 session_version, failed_attempts, locked_until`,
      [id, username, passwordHash],
    );
    if (inserted[0]) return inserted[0];
  } catch {
    // Another first request may have created the bootstrap account concurrently.
  }

  const raced = await sql.query<LocalAccountRow>(
    `select id, username, password_hash, is_active, is_super_admin,
            session_version, failed_attempts, locked_until
       from leadership_local_accounts
      where is_super_admin = true
      order by created_at asc
      limit 1`,
  );
  if (!raced[0]) throw new Error("Could not create the initial leadership account.");
  return raced[0];
}

export const loginLeadership = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => input)
  .handler(async ({ data }): Promise<LoginResult> => {
    const username = normalizeUsername(data.username);
    const password = data.password;
    if (!username || !password) return { ok: false, error: "Enter your username and password." };
    if (password.length > 128) return { ok: false, error: "Invalid username or password." };

    await ensureBootstrapAccount();

    const { getSql } = await import("@/lib/db");
    const { verifyLeadershipPassword } = await import("@/lib/leadership-password.server");
    const { useLeadershipSession } = await import("@/lib/leadership-session.server");
    const sql = await getSql();

    const rows = await sql.query<LocalAccountRow>(
      `select id, username, password_hash, is_active, is_super_admin,
              session_version, failed_attempts, locked_until
         from leadership_local_accounts
        where lower(username) = lower($1)
        limit 1`,
      [username],
    );
    const account = rows[0];

    if (!account || !account.is_active) {
      await verifyLeadershipPassword(password, "invalid$");
      return { ok: false, error: "Invalid username or password." };
    }

    const now = Date.now();
    const lockedUntil = account.locked_until
      ? new Date(account.locked_until).getTime()
      : 0;
    if (lockedUntil > now) {
      return {
        ok: false,
        error: "Too many failed sign-in attempts. Try again in a few minutes.",
      };
    }

    const valid = await verifyLeadershipPassword(password, account.password_hash);
    if (!valid) {
      const priorFailures = lockedUntil && lockedUntil <= now ? 0 : account.failed_attempts;
      const failures = priorFailures + 1;
      const lock = failures >= 5 ? new Date(now + 15 * 60 * 1000) : null;
      await sql.query(
        `update leadership_local_accounts
            set failed_attempts = $2,
                locked_until = $3,
                updated_at = now()
          where id = $1`,
        [account.id, failures, lock],
      );
      return { ok: false, error: "Invalid username or password." };
    }

    await sql.query(
      `update leadership_local_accounts
          set failed_attempts = 0,
              locked_until = null,
              last_login_at = now(),
              updated_at = now()
        where id = $1`,
      [account.id],
    );

    const session = await useLeadershipSession();
    await session.update({
      accountId: account.id,
      username: account.username,
      isSuperAdmin: account.is_super_admin,
      sessionVersion: account.session_version,
    });

    return { ok: true };
  });

export const fetchLocalLeadershipProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipLocalProfile | null> => {
    const { getLocalLeadershipProfile } = await import("@/lib/local-leadership-access.server");
    const profile = await getLocalLeadershipProfile();
    if (!profile) return null;
    return {
      id: profile.id,
      username: profile.username,
      isSuperAdmin: profile.isSuperAdmin,
    };
  },
);

export const logoutLeadership = createServerFn({ method: "POST" }).handler(async () => {
  const { useLeadershipSession } = await import("@/lib/leadership-session.server");
  const session = await useLeadershipSession();
  await session.clear();
  return true;
});

export const changeLocalLeadershipUsername = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) => input)
  .handler(async ({ data }): Promise<LeadershipLocalProfile> => {
    const username = validateUsername(data.username);
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const { useLeadershipSession } = await import("@/lib/leadership-session.server");
    const profile = await requireLocalLeadership();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const taken = await sql.query<{ id: string }>(
      `select id
         from leadership_local_accounts
        where lower(username) = lower($1) and id <> $2
        limit 1`,
      [username, profile.id],
    );
    if (taken[0]) throw new Error("That username is already in use.");

    const updated = await sql.query<{
      id: string;
      username: string;
      is_super_admin: boolean;
      session_version: number;
    }>(
      `update leadership_local_accounts
          set username = $2,
              updated_at = now()
        where id = $1 and is_active = true
      returning id, username, is_super_admin, session_version`,
      [profile.id, username],
    );
    const row = updated[0];
    if (!row) throw new Error("Could not update username.");

    const session = await useLeadershipSession();
    await session.update({
      accountId: row.id,
      username: row.username,
      isSuperAdmin: row.is_super_admin,
      sessionVersion: row.session_version,
    });

    return { id: row.id, username: row.username, isSuperAdmin: row.is_super_admin };
  });

export const changeLocalLeadershipPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { currentPassword: string; newPassword: string }) => input)
  .handler(async ({ data }): Promise<boolean> => {
    if (data.newPassword.length < 8 || data.newPassword.length > 128) {
      throw new Error("New password must be between 8 and 128 characters.");
    }

    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const { useLeadershipSession } = await import("@/lib/leadership-session.server");
    const { hashLeadershipPassword, verifyLeadershipPassword } = await import(
      "@/lib/leadership-password.server"
    );
    const profile = await requireLocalLeadership();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const rows = await sql.query<LocalAccountRow>(
      `select id, username, password_hash, is_active, is_super_admin,
              session_version, failed_attempts, locked_until
         from leadership_local_accounts
        where id = $1
        limit 1`,
      [profile.id],
    );
    const account = rows[0];
    if (!account || !account.is_active) throw new Error("Leadership account is not active.");

    const valid = await verifyLeadershipPassword(data.currentPassword, account.password_hash);
    if (!valid) throw new Error("Current password is incorrect.");

    const newHash = await hashLeadershipPassword(data.newPassword);
    const updated = await sql.query<{ session_version: number }>(
      `update leadership_local_accounts
          set password_hash = $2,
              session_version = session_version + 1,
              failed_attempts = 0,
              locked_until = null,
              updated_at = now()
        where id = $1
      returning session_version`,
      [account.id, newHash],
    );
    const newVersion = updated[0]?.session_version;
    if (!newVersion) throw new Error("Could not update password.");

    const session = await useLeadershipSession();
    await session.update({
      accountId: account.id,
      username: account.username,
      isSuperAdmin: account.is_super_admin,
      sessionVersion: newVersion,
    });

    return true;
  });
