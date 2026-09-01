import { createServerFn } from "@tanstack/react-start";
import {
  EMPTY_DISCORD_EVENT_FEED,
  type DiscordWebsiteEventFeed,
} from "@/lib/discord-events";

const DEFAULT_FEED_URL =
  "https://1st-mi-matrix-r-d-production.up.railway.app/website-events";

function safeFeed(value: unknown): DiscordWebsiteEventFeed {
  if (!value || typeof value !== "object") {
    return {
      ...EMPTY_DISCORD_EVENT_FEED,
      error: "Discord event feed returned invalid data.",
    };
  }

  const raw = value as Partial<DiscordWebsiteEventFeed>;
  return {
    ok: raw.ok === true,
    guildId: typeof raw.guildId === "string" ? raw.guildId : EMPTY_DISCORD_EVENT_FEED.guildId,
    allowedCategoryIds: Array.isArray(raw.allowedCategoryIds)
      ? raw.allowedCategoryIds.map(String)
      : [...EMPTY_DISCORD_EVENT_FEED.allowedCategoryIds],
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    categories: Array.isArray(raw.categories)
      ? raw.categories
          .filter((item): item is { id: string; name: string } =>
            Boolean(item && typeof item.id === "string" && typeof item.name === "string"),
          )
          .map((item) => ({ id: item.id, name: item.name }))
      : [],
    events: Array.isArray(raw.events) ? raw.events : [],
    stale: raw.stale === true,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

export const fetchDiscordWebsiteEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<DiscordWebsiteEventFeed> => {
    const feedUrl =
      process.env.DISCORD_EVENTS_FEED_URL?.trim() ||
      process.env.BOT_EVENTS_FEED_URL?.trim() ||
      DEFAULT_FEED_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(feedUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "1st-Mobile-Infantry-Website/1.0",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ...EMPTY_DISCORD_EVENT_FEED,
          error: `Discord event feed returned HTTP ${response.status}.`,
        };
      }

      return safeFeed(await response.json());
    } catch (error) {
      return {
        ...EMPTY_DISCORD_EVENT_FEED,
        error:
          error instanceof Error
            ? `Discord event feed unavailable: ${error.message}`
            : "Discord event feed unavailable.",
      };
    } finally {
      clearTimeout(timeout);
    }
  },
);
