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

export type HllvLiveFeed = {
  available: boolean;
  updatedAt: string;
  activePlayers: number;
  players: HllvPlayerStat[];
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
  tracked_players?: unknown;
  last_poll_at?: unknown;
  players?: RawPlayer[];
};

type RawLiveStats = {
  updated_at?: unknown;
  active_players?: unknown;
  players?: RawPlayer[];
};

const MAX_PUBLIC_PLAYERS = 10000;
const CONTROLLER_URLS = [
  "https://hllv-controller-production.up.railway.app",
  "https://hll.1stmid.com",
] as const;

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

async function fetchJson<T>(url: string, timeoutMs: number, cache: RequestCache = "default"): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Stats endpoint returned HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchPublicFromController(): Promise<RawPublicStats> {
  let lastError: unknown = null;
  for (const base of CONTROLLER_URLS) {
    try {
      return await fetchJson<RawPublicStats>(
        `${base}/public/stats/hllv?limit=${MAX_PUBLIC_PLAYERS}`,
        15_000,
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No HLL:V controller responded.");
}

async function fetchLiveFromController(): Promise<RawLiveStats> {
  let lastError: unknown = null;
  for (const base of CONTROLLER_URLS) {
    try {
      return await fetchJson<RawLiveStats>(
        `${base}/public/stats/hllv/live`,
        8_000,
        "no-store",
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No HLL:V live controller responded.");
}

export async function fetchHllvPublicStats(): Promise<HllvStatsFeed> {
  const fetchedAt = new Date().toISOString();
  try {
    const raw = await fetchPublicFromController();
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
}

export async function fetchHllvLiveStats(): Promise<HllvLiveFeed> {
  // Do not keep polling Railway while the browser tab is hidden.
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return {
      available: false,
      updatedAt: new Date().toISOString(),
      activePlayers: 0,
      players: [],
    };
  }

  try {
    const raw = await fetchLiveFromController();
    const players = Array.isArray(raw.players)
      ? raw.players.map(normalisePlayer).filter((player): player is HllvPlayerStat => Boolean(player))
      : [];
    return {
      available: true,
      updatedAt: optionalText(raw.updated_at) || new Date().toISOString(),
      activePlayers: finiteInt(raw.active_players) || players.length,
      players,
    };
  } catch {
    return {
      available: false,
      updatedAt: new Date().toISOString(),
      activePlayers: 0,
      players: [],
    };
  }
}
