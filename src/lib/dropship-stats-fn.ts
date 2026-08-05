import { createServerFn } from "@tanstack/react-start";

export type DropshipStats = {
  totalDropships: number | null;
  totalPoints: number | null;
  ok: boolean;
  source: "live" | "unconfigured" | "error";
};

/**
 * Proxy the Discord AAR bot stats API so the browser never needs CORS
 * and the bot URL stays server-side.
 *
 * Set on Vercel / host:
 *   DROPSHIP_STATS_URL=https://your-bot-host.example.com/stats
 *
 * The bot must expose GET /stats → { totalDropships, totalPoints }
 * (see the AAR bot's LIVE STATS API).
 */
export const fetchDropshipStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DropshipStats> => {
    const url =
      process.env.DROPSHIP_STATS_URL?.trim() ||
      process.env.VITE_DROPSHIP_STATS_URL?.trim() ||
      "";

    if (!url) {
      return {
        totalDropships: null,
        totalPoints: null,
        ok: false,
        source: "unconfigured",
      };
    }

    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        // Bot is external; short timeout so the page never hangs
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) {
        return {
          totalDropships: null,
          totalPoints: null,
          ok: false,
          source: "error",
        };
      }
      const data = (await res.json()) as {
        totalDropships?: number;
        totalPoints?: number;
        // older/local shape from bot file
        totalOperations?: number;
      };
      const totalDropships = Number(
        data.totalDropships ?? data.totalOperations ?? NaN,
      );
      const totalPoints = Number(data.totalPoints ?? NaN);
      return {
        totalDropships: Number.isFinite(totalDropships) ? totalDropships : null,
        totalPoints: Number.isFinite(totalPoints) ? totalPoints : null,
        ok: Number.isFinite(totalDropships),
        source: "live",
      };
    } catch {
      return {
        totalDropships: null,
        totalPoints: null,
        ok: false,
        source: "error",
      };
    }
  },
);
