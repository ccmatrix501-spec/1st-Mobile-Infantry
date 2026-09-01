export const DISCORD_EVENT_CATEGORY_IDS = [
  "1537621687267496027",
  "1256983174689591369",
  "1256981787960279154",
  "1271332208032092190",
] as const;

export type DiscordWebsiteEvent = {
  id: string;
  guildId: string;
  name: string;
  description: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  status: "scheduled" | "active" | "completed" | "cancelled" | "unknown";
  entityType: "voice" | "stage" | "external" | "unknown";
  location: string | null;
  channelId: string;
  channelName: string;
  categoryId: string;
  categoryName: string;
  creatorId: string | null;
  interestedCount: number | null;
  imageUrl: string | null;
  discordUrl: string;
};

export type DiscordWebsiteEventCategory = {
  id: string;
  name: string;
};

export type DiscordWebsiteEventFeed = {
  ok: boolean;
  guildId: string;
  allowedCategoryIds: string[];
  updatedAt: string | null;
  categories: DiscordWebsiteEventCategory[];
  events: DiscordWebsiteEvent[];
  stale: boolean;
  error: string | null;
};

export const EMPTY_DISCORD_EVENT_FEED: DiscordWebsiteEventFeed = {
  ok: false,
  guildId: "1256977709884641382",
  allowedCategoryIds: [...DISCORD_EVENT_CATEGORY_IDS],
  updatedAt: null,
  categories: DISCORD_EVENT_CATEGORY_IDS.map((id) => ({ id, name: id })),
  events: [],
  stale: true,
  error: null,
};
