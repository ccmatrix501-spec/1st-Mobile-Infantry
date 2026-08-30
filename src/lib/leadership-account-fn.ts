import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

type UserRow = {
  id: string;
  email: string;
  name: string;
};

type CredentialRow = {
  id: string;
};

type SuperAdminRow = {
  user_id: string;
  username: string;
  bootstrap_finalized: boolean;
};

export type LeadershipProfile = {
  username: string;
  email: string;
  isSuperAdmin: boolean;
};

export type BootstrapStatus = {
  ready: boolean;
  username: string;
  message?: string;
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

function localEmail(username: string): string {
  return `${username}@1stmid.local`;
}

function readBootstrapPassword(): string | null {
  const password = process.env.LEADERSHIP_BOOTSTRAP_PASSWORD?.trim();
  if (!password) return null;
  if (password.length < 8 || password.length > 128) return null;
  return password;
}

async function setCredentialPassword(userId: string, password: string): Promise<void> {
  // Use Better Auth's own configured hasher + internal adapter. This guarantees
  // the seeded credential is in exactly the format signIn.email expects.
  const { auth } = await import("@/lib/auth/server");
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const credential = await sql.query<CredentialRow>(
    `select "id" as id from "account"
      where "userId" = $1 and "providerId" = 'credential'
      limit 1`,
    [userId],
  );

  if (credential[0]) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.createAccount({
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
    });
  }
}

/**
 * Creates or repairs the first local leadership credential from server-side
 * deployment secrets. Until the first successful admin session reaches the
 * control panel, the configured bootstrap password may repair the initial
 * credential. Once finalized, bootstrap never overwrites changed credentials.
 */
export const ensureBootstrapLeadership = createServerFn({ method: "POST" }).handler(
  async (): Promise<BootstrapStatus> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const configuredUsername = validateUsername(
      process.env.LEADERSHIP_BOOTSTRAP_USERNAME?.trim() || "1stadmin",
    );

    const existingSuperAdmin = await sql.query<SuperAdminRow>(
      `select user_id, username, bootstrap_finalized
         from leadership_accounts
        where is_super_admin = true and is_active = true
        order by created_at asc
        limit 1`,
    );

    if (existingSuperAdmin[0]?.bootstrap_finalized) {
      return { ready: true, username: existingSuperAdmin[0].username };
    }

    const password = readBootstrapPassword();
    if (!password) {
      return {
        ready: false,
        username: existingSuperAdmin[0]?.username ?? configuredUsername,
        message:
          "Initial leadership password is missing or invalid. Check LEADERSHIP_BOOTSTRAP_PASSWORD in Vercel and redeploy.",
      };
    }

    // A partially-created first admin can exist after an earlier failed deploy.
    // Repair its credential with Better Auth's own hasher until bootstrap is finalized.
    if (existingSuperAdmin[0]) {
      await setCredentialPassword(existingSuperAdmin[0].user_id, password);
      return { ready: true, username: existingSuperAdmin[0].username };
    }

    const username = configuredUsername;
    const email = localEmail(username);
    let users = await sql.query<UserRow>(
      'select "id" as id, "email" as email, "name" as name from "user" where lower("email") = lower($1) limit 1',
      [email],
    );

    if (!users[0]) {
      const { auth } = await import("@/lib/auth/server");
      const ctx = await auth.$context;
      const user = await ctx.internalAdapter.createUser({
        email,
        name: username,
        emailVerified: true,
      });
      users = [{ id: user.id, email: user.email, name: user.name }];
    }

    const user = users[0];
    await setCredentialPassword(user.id, password);

    await sql.query(
      `insert into leadership_accounts
         (user_id, username, is_active, is_super_admin, bootstrap_finalized, updated_at)
       values ($1, $2, true, true, false, now())
       on conflict (user_id) do update
       set username = excluded.username,
           is_active = true,
           is_super_admin = true,
           updated_at = now()`,
      [user.id, username],
    );

    return { ready: true, username };
  },
);

/** Mark the one-time bootstrap complete after an authenticated admin reaches control. */
export const finalizeBootstrapLeadership = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<boolean> => {
    if (context.userId === "dev-user") return true;
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{ user_id: string }>(
      `update leadership_accounts
          set bootstrap_finalized = true,
              updated_at = now()
        where user_id = $1
          and is_super_admin = true
          and is_active = true
      returning user_id`,
      [context.userId],
    );
    return Boolean(rows[0]);
  });

export const fetchLeadershipProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LeadershipProfile> => {
    const { requireLeadership } = await import("@/lib/leadership-access.server");
    const account = await requireLeadership(context.userId);

    if (context.userId === "dev-user") {
      return {
        username: account.username,
        email: "dev@example.com",
        isSuperAdmin: true,
      };
    }

    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql.query<UserRow>(
      'select "id" as id, "email" as email, "name" as name from "user" where "id" = $1 limit 1',
      [context.userId],
    );
    const user = users[0];
    if (!user) throw new Error("Leadership account not found.");

    return {
      username: account.username,
      email: user.email,
      isSuperAdmin: account.is_super_admin,
    };
  });

export const changeLeadershipUsername = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((input: { username: string }) => input)
  .handler(async ({ data, context }): Promise<LeadershipProfile> => {
    const { requireLeadership } = await import("@/lib/leadership-access.server");
    await requireLeadership(context.userId);

    if (context.userId === "dev-user") {
      throw new Error("Username changes are unavailable in dev fallback mode.");
    }

    const username = validateUsername(data.username);
    const email = localEmail(username);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const credential = await sql.query<CredentialRow>(
      `select "id" as id from "account"
        where "userId" = $1 and "providerId" = 'credential'
        limit 1`,
      [context.userId],
    );
    if (!credential[0]) {
      throw new Error("Username changes are only available for local username/password accounts.");
    }

    const usernameTaken = await sql.query<{ user_id: string }>(
      `select user_id from leadership_accounts
        where lower(username) = lower($1) and user_id <> $2
        limit 1`,
      [username, context.userId],
    );
    if (usernameTaken[0]) throw new Error("That username is already in use.");

    const emailTaken = await sql.query<{ id: string }>(
      'select "id" as id from "user" where lower("email") = lower($1) and "id" <> $2 limit 1',
      [email, context.userId],
    );
    if (emailTaken[0]) throw new Error("That username is already in use.");

    const updated = await sql.query<{ username: string }>(
      `with updated_user as (
         update "user"
            set "email" = $1,
                "name" = $2,
                "updatedAt" = now()
          where "id" = $3
          returning "id"
       )
       update leadership_accounts
          set username = $2,
              updated_at = now()
        where user_id in (select "id" from updated_user)
       returning username`,
      [email, username, context.userId],
    );
    if (!updated[0]) throw new Error("Could not update username.");

    const account = await requireLeadership(context.userId);
    return {
      username: account.username,
      email,
      isSuperAdmin: account.is_super_admin,
    };
  });
