import { createServerFn } from "@tanstack/react-start";

const DEFAULT_BOT_URL = "https://1st-mi-matrix-r-d-production.up.railway.app";

export type BotControlModule = {
  id: string;
  label: string;
  loaded: boolean;
  restartable: boolean;
  restartScope?: string;
  detail?: string;
  restartCount?: number;
  lastRestartAt?: string | null;
  lastResult?: string | null;
  lastError?: string | null;
};

export type BotControlStatus = {
  ok: boolean;
  botReady: boolean;
  botUser: { id: string; tag: string } | null;
  guild: { id: string; name: string; memberCount: number } | null;
  websocketPing: number;
  uptimeSeconds: number;
  control?: Record<string, unknown>;
};

export type SafetyCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type BotSafety = {
  ok: boolean;
  score: number;
  checks: SafetyCheck[];
  guild: { id: string; name: string; memberCount: number } | null;
  bot: { id: string; tag: string; highestRole: string | null } | null;
  uptimeSeconds: number;
  websocketPing: number;
};

export type BotMemberProfile = {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  nickname: string | null;
  bot: boolean;
  avatarUrl: string;
  createdTimestamp: number;
  joinedTimestamp: number | null;
  roles: Array<{ id: string; name: string; position: number; managed: boolean }>;
  highestRole: string | null;
  voiceChannel: { id: string; name: string } | null;
  timedOutUntil: number | null;
  importantPermissions: string[];
};

export type LeadershipAuditEntry = {
  id: string;
  at: string;
  action: string;
  actorId: string | null;
  details: Record<string, unknown>;
  undo: Record<string, unknown> | null;
  undoneAt: string | null;
  undoneBy: string | null;
};

export type LeadershipOperation = {
  id: string;
  title: string;
  game?: string;
  details?: string;
  targetUnix: number;
  status: string;
  createdBy: string;
  createdAt: string;
  rsvp?: {
    attending?: string[];
    maybe?: string[];
    unable?: string[];
  };
};

export type LeadershipTicket = {
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

export type LeadershipDiscordChannel = {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
  type?: number;
};

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

function botUrl(): string {
  const configured =
    process.env.BOT_CONTROL_BOT_URL?.trim() ||
    process.env.STORE_ORDER_BOT_URL?.trim() ||
    process.env.STORE_BOT_URL?.trim() ||
    DEFAULT_BOT_URL;
  const base = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return base.replace(/\/$/, "");
}

function botSecret(): string {
  return (
    process.env.LEADERSHIP_BOT_CONTROL_SECRET?.trim() ||
    process.env.STORE_ORDER_API_SECRET?.trim() ||
    process.env.STORE_BOT_ORDER_SECRET?.trim() ||
    ""
  );
}

async function requestBot<T>(
  path: string,
  options: RequestInit = {},
  leadershipId?: string,
): Promise<T> {
  const secret = botSecret();
  if (!secret) {
    throw new Error(
      "The website-to-bot control secret is not configured. Set LEADERSHIP_BOT_CONTROL_SECRET on both services, or keep the existing STORE_ORDER_API_SECRET fallback matched.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${botUrl()}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "1st-Mobile-Infantry-Leadership-Control/1.0",
        "X-Store-Order-Secret": secret,
        ...(leadershipId ? { "X-1stMI-Leadership-Id": leadershipId } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error?: unknown }).error || "")
          : "";
      throw new Error(message || `Tech Support bot returned HTTP ${response.status}.`);
    }

    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The Tech Support bot did not respond before the control request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchLeadershipBotStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<BotControlStatus> => {
    const leadership = await requireLeadership();
    return requestBot<BotControlStatus>(
      "/website-control/status",
      {},
      leadership.id,
    );
  },
);

export const fetchLeadershipBotSafety = createServerFn({ method: "GET" }).handler(
  async (): Promise<BotSafety> => {
    const leadership = await requireLeadership();
    return requestBot<BotSafety>(
      "/website-control/safety",
      {},
      leadership.id,
    );
  },
);

export const fetchLeadershipBotModules = createServerFn({ method: "GET" }).handler(
  async (): Promise<BotControlModule[]> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean; modules: BotControlModule[] }>(
      "/website-control/modules",
      {},
      leadership.id,
    );
    return Array.isArray(result.modules) ? result.modules : [];
  },
);

export const restartLeadershipBotModule = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    const id = String(data.id || "").trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(id)) throw new Error("Invalid module id.");
    return requestBot<Record<string, unknown>>(
      `/website-control/modules/${encodeURIComponent(id)}/restart`,
      { method: "POST", body: "{}" },
      leadership.id,
    );
  });

export const syncLeadershipAutomaticRoles = createServerFn({ method: "POST" }).handler(
  async () => {
    const leadership = await requireLeadership();
    return requestBot<Record<string, unknown>>(
      "/website-control/role-automation/sync",
      { method: "POST", body: "{}" },
      leadership.id,
    );
  },
);

export const fetchLeadershipBotMember = createServerFn({ method: "GET" })
  .inputValidator((input: { memberId: string }) => input)
  .handler(async ({ data }): Promise<BotMemberProfile> => {
    const leadership = await requireLeadership();
    const memberId = String(data.memberId || "").trim();
    if (!/^\d{16,22}$/.test(memberId)) {
      throw new Error("Enter a valid Discord member ID.");
    }
    const result = await requestBot<{ ok: boolean; profile: BotMemberProfile }>(
      `/website-control/member/${encodeURIComponent(memberId)}`,
      {},
      leadership.id,
    );
    return result.profile;
  });

export const fetchLeadershipBotAudit = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number } | undefined) => input || {})
  .handler(async ({ data }): Promise<LeadershipAuditEntry[]> => {
    const leadership = await requireLeadership();
    const limit = Math.max(1, Math.min(50, Number(data.limit) || 20));
    const result = await requestBot<{ ok: boolean; entries: LeadershipAuditEntry[] }>(
      `/website-control/audit?limit=${limit}`,
      {},
      leadership.id,
    );
    return Array.isArray(result.entries) ? result.entries : [];
  });

export const fetchLeadershipBotOperations = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipOperation[]> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean; operations: LeadershipOperation[] }>(
      "/website-control/operations",
      {},
      leadership.id,
    );
    return Array.isArray(result.operations) ? result.operations : [];
  },
);

export const fetchLeadershipBotTickets = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipTicket[]> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean; tickets: LeadershipTicket[] }>(
      "/website-control/tickets",
      {},
      leadership.id,
    );
    return Array.isArray(result.tickets) ? result.tickets : [];
  },
);

export const closeLeadershipBotTicket = createServerFn({ method: "POST" })
  .inputValidator((input: { ticketId: string }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    const ticketId = String(data.ticketId || "").trim();
    if (!ticketId) throw new Error("Ticket id is required.");
    return requestBot<{ ok: boolean; ticket: LeadershipTicket }>(
      `/website-control/tickets/${encodeURIComponent(ticketId)}/close`,
      { method: "POST", body: "{}" },
      leadership.id,
    );
  });

export const fetchLeadershipBotChannels = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipDiscordChannel[]> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean; channels: LeadershipDiscordChannel[] }>(
      "/website-control/channels",
      {},
      leadership.id,
    );
    return Array.isArray(result.channels) ? result.channels : [];
  },
);

export const createLeadershipBotOperation = createServerFn({ method: "POST" })
  .inputValidator((input: {
    channelId: string;
    title: string;
    date: string;
    time: string;
    game?: string;
    details?: string;
  }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    return requestBot<{ ok: boolean; operation: LeadershipOperation }>(
      "/website-control/operations",
      { method: "POST", body: JSON.stringify(data) },
      leadership.id,
    );
  });

export const cancelLeadershipBotOperation = createServerFn({ method: "POST" })
  .inputValidator((input: { operationId: string }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    const operationId = String(data.operationId || "").trim();
    if (!operationId) throw new Error("Operation id is required.");
    return requestBot<{ ok: boolean; operation: LeadershipOperation }>(
      `/website-control/operations/${encodeURIComponent(operationId)}/cancel`,
      { method: "POST", body: "{}" },
      leadership.id,
    );
  });


export const undoLeadershipBotAudit = createServerFn({ method: "POST" }).handler(
  async () => {
    const leadership = await requireLeadership();
    return requestBot<{ ok: boolean; undone: { id: string; action: string } }>(
      "/website-control/audit/undo",
      { method: "POST", body: "{}" },
      leadership.id,
    );
  },
);


export type BotGuildRoleOption = {
  id: string;
  name: string;
  position: number;
  managed: boolean;
  editable: boolean;
  botCanManage: boolean;
};

export type BotGuildChannelOption = {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  parentName: string | null;
  textBased: boolean;
  voiceBased: boolean;
};

export type BotGuildOptions = {
  guild: { id: string; name: string };
  roles: BotGuildRoleOption[];
  channels: BotGuildChannelOption[];
};

export type LeadershipBotSettings = Record<string, unknown>;

export type LeadershipBotSettingsResponse = {
  settings: LeadershipBotSettings;
  editableSections: string[];
  onboardingCompletionCount: number;
};

export const fetchLeadershipBotGuildOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<BotGuildOptions> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean } & BotGuildOptions>(
      "/website-control/guild-options",
      {},
      leadership.id,
    );
    return {
      guild: result.guild,
      roles: Array.isArray(result.roles) ? result.roles : [],
      channels: Array.isArray(result.channels) ? result.channels : [],
    };
  },
);

export const fetchLeadershipBotSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipBotSettingsResponse> => {
    const leadership = await requireLeadership();
    const result = await requestBot<{ ok: boolean } & LeadershipBotSettingsResponse>(
      "/website-control/settings",
      {},
      leadership.id,
    );
    return {
      settings: result.settings || {},
      editableSections: Array.isArray(result.editableSections) ? result.editableSections : [],
      onboardingCompletionCount: Number(result.onboardingCompletionCount || 0),
    };
  },
);

export const saveLeadershipBotSettingsSection = createServerFn({ method: "POST" })
  .inputValidator((input: { section: string; value: unknown }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    const section = String(data.section || "").trim();
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(section)) {
      throw new Error("Invalid settings section.");
    }
    return requestBot<{
      ok: boolean;
      section: string;
      value: unknown;
      settings: LeadershipBotSettings;
    }>(
      `/website-control/settings/${encodeURIComponent(section)}`,
      { method: "PUT", body: JSON.stringify({ value: data.value }) },
      leadership.id,
    );
  });

export const resetLeadershipOnboardingMember = createServerFn({ method: "POST" })
  .inputValidator((input: { memberId: string }) => input)
  .handler(async ({ data }) => {
    const leadership = await requireLeadership();
    const memberId = String(data.memberId || "").trim();
    if (!/^\d{15,22}$/.test(memberId)) throw new Error("Enter a valid Discord member ID.");
    return requestBot<{ ok: boolean; memberId: string; cleared: boolean }>(
      `/website-control/onboarding/${encodeURIComponent(memberId)}/reset`,
      { method: "POST", body: "{}" },
      leadership.id,
    );
  });
