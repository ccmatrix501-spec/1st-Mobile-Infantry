import { createServerFn } from "@tanstack/react-start";
import type { LeadershipPoll, PollOption } from "@/lib/polls";

const DEFAULT_BOT_URL = "https://1st-mi-matrix-r-d-production.up.railway.app";
const DEFAULT_SITE_URL = "https://1stmid.com";
const POLL_ID_PATTERN = /^[a-f0-9-]{32,64}$/i;
const CHANNEL_ID_PATTERN = /^\d{15,22}$/;

type PollRow = {
  id: string;
  share_code: string;
  title: string;
  description: string;
  allow_additions: boolean;
  is_open: boolean;
  max_selections: number;
  require_discord_name: boolean;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};

type PollOptionRow = {
  id: string;
  label: string;
  emoji: string;
  image_url: string;
  sort_order: number;
  is_user_added: boolean;
  votes: number;
};

export type PollDiscordPublishResult = {
  ok: boolean;
  channelId: string;
  channelName: string;
  targetId: string;
  messageId: string;
  url: string;
};

export type PollDiscordHealth = {
  ok: boolean;
  botReady: boolean;
  configured: boolean;
  websiteVotingOnly?: boolean;
  panelVersion?: number;
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

function siteUrl(): string {
  const configured =
    process.env.POLL_SITE_URL?.trim() ||
    process.env.STORE_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    DEFAULT_SITE_URL;
  const base = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return base.replace(/\/$/, "");
}

function absoluteImageUrl(value: string): string {
  const image = String(value || "").trim();
  if (!image) return "";
  if (image.startsWith("/")) return `${siteUrl()}${image}`;
  try {
    const parsed = new URL(image);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function effectiveOpen(row: Pick<PollRow, "is_open" | "closes_at">): boolean {
  if (!row.is_open) return false;
  if (!row.closes_at) return true;
  const closes = Date.parse(row.closes_at);
  return !Number.isFinite(closes) || closes > Date.now();
}

function requestHeaders(secret: string, leadershipId: string): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": "1st-Mobile-Infantry-Website-Polls/2.0",
    "X-Store-Order-Secret": secret,
    "X-1stMI-Leadership-Id": leadershipId,
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function bodyError(body: unknown): string {
  return body && typeof body === "object" && "error" in body
    ? String((body as { error?: unknown }).error || "")
    : "";
}

async function loadPoll(pollId: string): Promise<LeadershipPoll> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<PollRow>(
    `select id, share_code, title, description, allow_additions, is_open,
            max_selections, require_discord_name,
            closes_at::text as closes_at,
            created_at::text as created_at, updated_at::text as updated_at
       from polls
      where id = $1
      limit 1`,
    [pollId],
  );
  const row = rows[0];
  if (!row) throw new Error("The selected website poll was not found.");

  const [optionRows, voterRows] = await Promise.all([
    sql.query<PollOptionRow>(
      `select o.id,
              o.label,
              o.emoji,
              o.image_url,
              o.sort_order,
              o.is_user_added,
              count(v.id)::int as votes
         from poll_options o
         left join poll_votes v on v.option_id = o.id
        where o.poll_id = $1
          and o.active = true
        group by o.id, o.label, o.emoji, o.image_url, o.sort_order, o.is_user_added
        order by o.sort_order asc, o.created_at asc`,
      [pollId],
    ),
    sql.query<{ count: number }>(
      `select count(distinct voter_hash)::int as count
         from poll_votes
        where poll_id = $1`,
      [pollId],
    ),
  ]);

  const options: PollOption[] = optionRows.map((option) => ({
    id: option.id,
    label: option.label,
    emoji: option.emoji || "",
    imageUrl: option.image_url || "",
    sortOrder: Number(option.sort_order),
    isUserAdded: option.is_user_added === true,
    votes: Number(option.votes || 0),
  }));

  return {
    id: row.id,
    shareCode: row.share_code,
    title: row.title,
    description: row.description || "",
    allowAdditions: row.allow_additions === true,
    isOpen: effectiveOpen(row),
    maxSelections: Math.max(1, Math.min(options.length || 1, Number(row.max_selections) || 1)),
    requireDiscordName: row.require_discord_name === true,
    closesAt: row.closes_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalVotes: options.reduce((total, option) => total + option.votes, 0),
    totalVoters: Number(voterRows[0]?.count || 0),
    voterDiscordName: "",
    selectedOptionId: null,
    selectedOptionIds: [],
    options,
    voters: [],
  };
}

async function publishToBot(
  poll: LeadershipPoll,
  channelId: string,
  leadershipId: string,
): Promise<PollDiscordPublishResult> {
  const secret = botSecret();
  if (!secret) {
    throw new Error(
      "The website-to-bot secret is not configured. Match LEADERSHIP_BOT_CONTROL_SECRET or STORE_ORDER_API_SECRET on Vercel and Railway.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const shareUrl = `${siteUrl()}/poll/${poll.shareCode}`;
    const response = await fetch(`${botUrl()}/website-polls/publish`, {
      method: "POST",
      cache: "no-store",
      headers: {
        ...requestHeaders(secret, leadershipId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId,
        poll: {
          id: poll.id,
          shareCode: poll.shareCode,
          title: poll.title,
          description: poll.description,
          allowAdditions: poll.allowAdditions,
          isOpen: poll.isOpen,
          maxSelections: poll.maxSelections,
          requireDiscordName: poll.requireDiscordName,
          closesAt: poll.closesAt,
          totalVotes: poll.totalVotes,
          totalVoters: poll.totalVoters,
          shareUrl,
          options: poll.options.map((option) => ({
            id: option.id,
            label: option.label,
            emoji: option.emoji,
            imageUrl: absoluteImageUrl(option.imageUrl),
            votes: option.votes,
            isUserAdded: option.isUserAdded,
          })),
        },
      }),
      signal: controller.signal,
    });

    const body = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(
        bodyError(body) ||
          (response.status === 404
            ? "The Discord poll panel endpoint is not deployed on the Tech Support bot yet."
            : `Tech Support bot returned HTTP ${response.status}.`),
      );
    }
    return body as PollDiscordPublishResult;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The Tech Support bot did not respond before the poll publish request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchPollDiscordHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<PollDiscordHealth> => {
    const leadership = await requireLeadership();
    const secret = botSecret();
    if (!secret) {
      throw new Error(
        "The website-to-bot secret is not configured. Match LEADERSHIP_BOT_CONTROL_SECRET or STORE_ORDER_API_SECRET on Vercel and Railway.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${botUrl()}/website-polls/health`, {
        cache: "no-store",
        headers: requestHeaders(secret, leadership.id),
        signal: controller.signal,
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(
          bodyError(body) ||
            (response.status === 404
              ? "The Discord poll panel endpoint is not deployed on the Tech Support bot yet."
              : `Tech Support bot returned HTTP ${response.status}.`),
        );
      }
      const health = body as PollDiscordHealth;
      if (Number(health.panelVersion || 0) < 2) {
        throw new Error("The Tech Support bot is running an older poll panel version and needs to be redeployed.");
      }
      if (!health.botReady) throw new Error("The Tech Support bot is not connected to Discord.");
      if (!health.configured) throw new Error("The Discord poll panel secret is not configured on the bot host.");
      return health;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("The Tech Support bot did not respond to the poll panel health check.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
);

export const publishLeadershipPollToDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: { pollId: string; channelId: string }) => input)
  .handler(async ({ data }): Promise<PollDiscordPublishResult> => {
    const leadership = await requireLeadership();
    const pollId = String(data.pollId || "").trim();
    const channelId = String(data.channelId || "").trim();
    if (!POLL_ID_PATTERN.test(pollId)) throw new Error("Select a saved website poll.");
    if (!CHANNEL_ID_PATTERN.test(channelId)) throw new Error("Select a valid Discord channel.");
    const poll = await loadPoll(pollId);
    return publishToBot(poll, channelId, leadership.id);
  });
