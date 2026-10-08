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
