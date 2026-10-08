import { createServerFn } from "@tanstack/react-start";

const DEFAULT_BOT_URL =
  "https://1st-mi-matrix-r-d-production.up.railway.app";

export type BotControllerStatus = {
  ok?: boolean;
  botReady?: boolean;
  botUser?: { id: string; tag: string } | null;
  guild?: { id: string; name: string; memberCount: number } | null;
  websocketPing?: number;
  uptimeSeconds?: number;
  control?: Record<string, unknown>;
};

export type BotSafetyCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type BotSafety = {
  ok: boolean;
  score: number;
  checks: BotSafetyCheck[];
  guild?: { id: string; name: string; memberCount: number } | null;
  bot?: { id: string; tag: string; highestRole: string | null } | null;
  uptimeSeconds?: number;
  websocketPing?: number;
};

export type BotModule = {
  id: string;
  label: string;
  loaded: boolean;
  restartable: boolean;
  restartScope: string;
  detail: string;
  status: string;
  lastRestartAt?: string | null;
  lastError?: string | null;
};

export type TechTicket = {
  id: string;
  guildId: string;
  channelId: string;
  categoryId: string;
  userId: string;
  status: string;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  closedAt?: string | null;
  closedBy?: string | null;
};

export type TechOperation = {
  id: string;
  guildId: string;
  channelId: string;
  messageId?: string | null;
  title: string;
  game?: string;
  details?: string;
  targetUnix: number;
  sourceTimezone?: string;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  rsvp?: {
    attending?: string[];
    maybe?: string[];
    unable?: string[];
  };
};

export type AuditEntry = {
  id: string;
  at: string;
  action: string;
  actorId?: string | null;
  details?: Record<string, unknown>;
  undo?: Record<string, unknown> | null;
  undoneAt?: string | null;
  undoneBy?: string | null;
};

export type DiscordTextChannel = {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
  type?: number;
};

export type MemberProfile = {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  nickname?: string | null;
  bot: boolean;
  avatarUrl?: string | null;
  createdTimestamp: number;
  joinedTimestamp?: number | null;
  roles: Array<{
    id: string;
    name: string;
    position: number;
    managed: boolean;
  }>;
  highestRole?: string | null;
  voiceChannel?: { id: string; name: string } | null;
  timedOutUntil?: number | null;
  importantPermissions: string[];
};

export type TechSupportOverview = {
  status: BotControllerStatus | null;
  safety: BotSafety | null;
  modules: BotModule[];
  tickets: TechTicket[];
  operations: TechOperation[];
  audit: AuditEntry[];
  channels: DiscordTextChannel[];
  errors: string[];
};

function botBaseUrl(): string {
  const configured =
    process.env.LEADERSHIP_BOT_CONTROL_URL?.trim() ||
    process.env.TECH_SUPPORT_BOT_URL?.trim() ||
    process.env.STORE_ORDER_BOT_URL?.trim() ||
    process.env.STORE_BOT_URL?.trim() ||
    DEFAULT_BOT_URL;
  const base = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;
  return base.replace(/\/$/, "");
}

function bridgeSecret(): string {
  return (
    process.env.LEADERSHIP_BOT_CONTROL_SECRET?.trim() ||
    process.env.STORE_ORDER_API_SECRET?.trim() ||
    process.env.STORE_BOT_ORDER_SECRET?.trim() ||
    ""
  );
}

async function requireLeader() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

async function requestBot<T>(
  path: string,
  profile: { id: string },
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const secret = bridgeSecret();
  if (!secret) {
    throw new Error(
      "Leadership bot control is not configured. Set LEADERSHIP_BOT_CONTROL_SECRET on the website and bot, or reuse the existing STORE_ORDER_API_SECRET.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(
      `${botBaseUrl()}/website-control/${path.replace(/^\/+/, "")}`,
      {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
          "X-1stMI-Leadership-Id": profile.id,
          "User-Agent": "1st-Mobile-Infantry-Leadership-Control/1.0",
        },
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      [key: string]: unknown;
    };
    if (!response.ok) {
      throw new Error(
        payload.error ||
          `Tech Support bot returned HTTP ${response.status}.`,
      );
    }
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tech Support bot request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function safePart<T>(
  work: Promise<T>,
  errors: string[],
  label: string,
  fallback: T,
): Promise<T> {
  try {
    return await work;
  } catch (error) {
    errors.push(
      `${label}: ${error instanceof Error ? error.message : "unavailable"}`,
    );
    return fallback;
  }
}

export const fetchTechSupportOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<TechSupportOverview> => {
    const profile = await requireLeader();
    const errors: string[] = [];

    const [
      statusResult,
      safetyResult,
      modulesResult,
      ticketsResult,
      operationsResult,
      auditResult,
      channelsResult,
    ] = await Promise.all([
      safePart(
        requestBot<{ ok: boolean } & BotControllerStatus>("status", profile),
        errors,
        "Bot status",
        null as BotControllerStatus | null,
      ),
      safePart(
        requestBot<BotSafety>("safety", profile),
        errors,
        "Server safety",
        null as BotSafety | null,
      ),
      safePart(
        requestBot<{ modules?: BotModule[] }>("modules", profile),
        errors,
        "Modules",
        { modules: [] },
      ),
      safePart(
        requestBot<{ tickets?: TechTicket[] }>("tickets", profile),
        errors,
        "Tickets",
        { tickets: [] },
      ),
      safePart(
        requestBot<{ operations?: TechOperation[] }>("operations", profile),
        errors,
        "Operations",
        { operations: [] },
      ),
      safePart(
        requestBot<{ entries?: AuditEntry[] }>("audit?limit=30", profile),
        errors,
        "Audit",
        { entries: [] },
      ),
      safePart(
        requestBot<{ channels?: DiscordTextChannel[] }>("channels", profile),
        errors,
        "Channels",
        { channels: [] },
      ),
    ]);

    return {
      status: statusResult,
      safety: safetyResult,
      modules: modulesResult.modules || [],
      tickets: ticketsResult.tickets || [],
      operations: operationsResult.operations || [],
      audit: auditResult.entries || [],
      channels: channelsResult.channels || [],
      errors,
    };
  },
);

export const fetchTechSupportMemberProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { memberId: string }) => input)
  .handler(async ({ data }): Promise<MemberProfile> => {
    const profile = await requireLeader();
    const memberId = String(data.memberId || "").trim();
    if (!/^\d{16,22}$/.test(memberId)) {
      throw new Error("Enter a valid Discord member ID.");
    }
    const response = await requestBot<{ profile: MemberProfile }>(
      `member/${encodeURIComponent(memberId)}`,
      profile,
    );
    return response.profile;
  });

export const restartTechSupportModule = createServerFn({ method: "POST" })
  .inputValidator((input: { moduleId: string }) => input)
  .handler(async ({ data }) => {
    const profile = await requireLeader();
    const id = String(data.moduleId || "").trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(id)) throw new Error("Invalid module id.");
    return requestBot<{ ok: boolean; message?: string }>(
      `modules/${encodeURIComponent(id)}/restart`,
      profile,
      { method: "POST", body: {} },
    );
  });

export const syncTechSupportRoleAutomation = createServerFn({ method: "POST" }).handler(
  async () => {
    const profile = await requireLeader();
    return requestBot<{ ok: boolean; result?: Record<string, unknown> }>(
      "role-automation/sync",
      profile,
      { method: "POST", body: {} },
    );
  },
);

export const closeTechSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((input: { ticketId: string }) => input)
  .handler(async ({ data }) => {
    const profile = await requireLeader();
    const id = String(data.ticketId || "").trim();
    if (!id) throw new Error("Ticket id is required.");
    return requestBot<{ ok: boolean; ticket?: TechTicket }>(
      `tickets/${encodeURIComponent(id)}/close`,
      profile,
      { method: "POST", body: {} },
    );
  });

export const createTechSupportOperation = createServerFn({ method: "POST" })
  .inputValidator((input: {
    channelId: string;
    title: string;
    date: string;
    time: string;
    game?: string;
    details?: string;
  }) => input)
  .handler(async ({ data }) => {
    const profile = await requireLeader();
    return requestBot<{ ok: boolean; operation: TechOperation }>(
      "operations",
      profile,
      { method: "POST", body: data },
    );
  });

export const cancelTechSupportOperation = createServerFn({ method: "POST" })
  .inputValidator((input: { operationId: string }) => input)
  .handler(async ({ data }) => {
    const profile = await requireLeader();
    const id = String(data.operationId || "").trim();
    if (!id) throw new Error("Operation id is required.");
    return requestBot<{ ok: boolean; operation?: TechOperation }>(
      `operations/${encodeURIComponent(id)}/cancel`,
      profile,
      { method: "POST", body: {} },
    );
  });

export const undoTechSupportAuditAction = createServerFn({ method: "POST" }).handler(
  async () => {
    const profile = await requireLeader();
    return requestBot<{ ok: boolean; undone?: { id: string; action: string } }>(
      "audit/undo",
      profile,
      { method: "POST", body: {} },
    );
  },
);
