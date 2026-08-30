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
  username: string;
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

/**
 * Create the first local leadership account from server-side deployment secrets.
 * The password is never returned to the browser and is never stored in Git.
 * Existing credential passwords are never overwritten by this bootstrap.
 * Once a super-admin record exists, bootstrap is permanently considered complete
 * even if that administrator later changes username or password.
 */
export const ensureBootstrapLeadership = createServerFn({ method: "POST" }).handler(
  async (): Promise<BootstrapStatus> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const existingSuperAdmin = await sql.query<SuperAdminRow>(
      `select username
         from leadership_accounts
        where is_super_admin = true and is_active = true
        order by created_at asc
        limit 1`,
    );
    if (existingSuperAdmin[0]) {
      return { ready: true, username: existingSuperAdmin[0].username };
    }

    const configuredUsername =
      process.env.LEADERSHIP_BOOTSTRAP_USERNAME?.trim() || "1stadmin";
    const username = validateUsername(configuredUsername);
    const password = process.env.LEADERSHIP_BOOTSTRAP_PASSWORD?.trim();

    if (!password) {
      return {
        ready: false,
        username,
        message: "Initial leadership password has not been configured on the server.",
      };
    }
    if (password.length < 8 || password.length > 128) {
      return {
        ready: false,
        username,
        message: "Initial leadership password must be between 8 and 128 characters.",
      };
    }

    const email = localEmail(username);
    let users = await sql.query<UserRow>(
      'select "id" as id, "email" as email, "name" as name from "user" where lower("email") = lower($1) limit 1',
      [email],
    );

    if (!users[0]) {
      const { randomUUID } = await import("node:crypto");
      const { hashPassword } = await import("better-auth/crypto");
      const userId = randomUUID();
      const accountId = randomUUID();
      const passwordHash = await hashPassword(password);

      await sql.query(
        `insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
         values ($1, $2, $3, true, now(), now())`,
        [userId, username, email],
      );
      await sql.query(
        `insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
         values ($1, $2, 'credential', $2, $3, now(), now())`,
        [accountId, userId, passwordHash],
      );

      users = [{ id: userId, email, name: username }];
    } else {
      const credential = await sql.query<CredentialRow>(
        `select "id" as id from "account"
          where "userId" = $1 and "providerId" = 'credential'
          limit 1`,
        [users[0].id],
      );

      if (!credential[0]) {
        const { randomUUID } = await import("node:crypto");
        const { hashPassword } = await import("better-auth/crypto");
        const passwordHash = await hashPassword(password);
        await sql.query(
          `insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
           values ($1, $2, 'credential', $2, $3, now(), now())`,
          [randomUUID(), users[0].id, passwordHash],
        );
      }
    }

    const user = users[0];
    await sql.query(
      `insert into leadership_accounts (user_id, username, is_active, is_super_admin, updated_at)
       values ($1, $2, true, true, now())
       on conflict (user_id) do update
       set is_active = true,
           is_super_admin = true,
           updated_at = now()`,
      [user.id, username],
    );

    return { ready: true, username };
  },
);

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
