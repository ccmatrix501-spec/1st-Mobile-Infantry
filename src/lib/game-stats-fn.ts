import { createServerFn } from "@tanstack/react-start";

export type HllvFavourite = {
  id: string;
  name: string;
  kills: number;
};

export type HllvPlayerStat = {
  playerId: string;
  playerName: string;
  kills: number;
  deaths: number;
  revives: number;
  firstSeen: string | null;
  lastSeen: string | null;
  favouriteWeapon: HllvFavourite | null;
  favouriteVehicle: HllvFavourite | null;
};

export type HllvStatsFeed = {
  game: "Hell Let Loose: Vietnam";
  available: boolean;
  trackedPlayers: number;
  lastPollAt: string | null;
  fetchedAt: string;
  players: HllvPlayerStat[];
  error: string | null;
};

type RawFavourite = {
  id?: unknown;
  name?: unknown;
  kills?: unknown;
};

type RawPlayer = {
  player_id?: unknown;
  player_name?: unknown;
  kills?: unknown;
  deaths?: unknown;
  revives?: unknown;
  first_seen?: unknown;
  last_seen?: unknown;
  favorite_weapon?: RawFavourite | null;
  favorite_vehicle?: RawFavourite | null;
};

type RawPublicStats = {
  game?: unknown;
  tracked_players?: unknown;
  last_poll_at?: unknown;
  players?: RawPlayer[];
};

const DEFAULT_CONTROLLER_URL = "https://hll.1stmid.com";

function controllerBaseUrl(): string {
  const configured = process.env.HLLV_CONTROLLER_URL?.trim() || DEFAULT_CONTROLLER_URL;
  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return withProtocol.replace(/\/$/, "");
}

function finiteInt(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function optionalText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function normaliseFavourite(value: RawFavourite | null | undefined): HllvFavourite | null {
  if (!value || typeof value !== "object") return null;
  const name = String(value.name ?? "").trim();
  if (!name) return null;
  return {
    id: String(value.id ?? "").trim(),
    name,
    kills: finiteInt(value.kills),
  };
}

function normalisePlayer(raw: RawPlayer): HllvPlayerStat | null {
  const playerId = String(raw.player_id ?? "").trim();
  const playerName = String(raw.player_name ?? "").trim();
  if (!playerId || !playerName) return null;
  return {
    playerId,
    playerName,
    kills: finiteInt(raw.kills),
    deaths: finiteInt(raw.deaths),
    revives: finiteInt(raw.revives),
    firstSeen: optionalText(raw.first_seen),
    lastSeen: optionalText(raw.last_seen),
    favouriteWeapon: normaliseFavourite(raw.favorite_weapon),
    favouriteVehicle: normaliseFavourite(raw.favorite_vehicle),
  };
}

async function fetchPublicStats(base: string): Promise<RawPublicStats> {
  const response = await fetch(`${base}/public/stats/hllv?limit=1000`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "1st-Mobile-Infantry-Website/1.0",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Controller returned HTTP ${response.status}`);
  return (await response.json()) as RawPublicStats;
}

async function fetchAuthenticatedFallback(base: string): Promise<RawPublicStats> {
  const password = process.env.HLLV_CONTROLLER_PASSWORD?.trim();
  if (!password) throw new Error("Public stats endpoint is not available yet.");

  const login = await fetch(`${base}/controller/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "1st-Mobile-Infantry-Website/1.0",
    },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!login.ok) throw new Error("Controller authentication failed.");

  const setCookie = login.headers.get("set-cookie");
  const sessionCookie = setCookie?.split(";", 1)[0];
  if (!sessionCookie) throw new Error("Controller did not return a session cookie.");

  const [statsResponse, statusResponse] = await Promise.all([
    fetch(`${base}/api/v2/player-stats?limit=1000`, {
      headers: { Accept: "application/json", Cookie: sessionCookie },
      signal: AbortSignal.timeout(8_000),
    }),
    fetch(`${base}/api/v2/player-stats/status`, {
      headers: { Accept: "application/json", Cookie: sessionCookie },
      signal: AbortSignal.timeout(8_000),
    }),
  ]);

  if (!statsResponse.ok) throw new Error(`Stats endpoint returned HTTP ${statsResponse.status}`);
  const stats = (await statsResponse.json()) as { players?: RawPlayer[] };
  const status = statusResponse.ok
    ? ((await statusResponse.json()) as { tracked_players?: unknown; last_poll_at?: unknown })
    : {};

  return {
    game: "Hell Let Loose: Vietnam",
    tracked_players: status.tracked_players,
    last_poll_at: status.last_poll_at,
    players: Array.isArray(stats.players) ? stats.players : [],
  };
}

export const fetchHllvPublicStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<HllvStatsFeed> => {
    const fetchedAt = new Date().toISOString();
    try {
      const base = controllerBaseUrl();
      let raw: RawPublicStats;
      try {
        raw = await fetchPublicStats(base);
      } catch {
        raw = await fetchAuthenticatedFallback(base);
      }

      const players = Array.isArray(raw.players)
        ? raw.players.map(normalisePlayer).filter((player): player is HllvPlayerStat => Boolean(player))
        : [];

      return {
        game: "Hell Let Loose: Vietnam",
        available: true,
        trackedPlayers: finiteInt(raw.tracked_players) || players.length,
        lastPollAt: optionalText(raw.last_poll_at),
        fetchedAt,
        players,
        error: null,
      };
    } catch {
      return {
        game: "Hell Let Loose: Vietnam",
        available: false,
        trackedPlayers: 0,
        lastPollAt: null,
        fetchedAt,
        players: [],
        error: "The HLL:V stats feed is temporarily unavailable.",
      };
    }
  },
);
