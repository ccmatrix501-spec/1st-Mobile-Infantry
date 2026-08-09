import { createServerFn } from "@tanstack/react-start";

export type DropshipStats = {
  totalDropships: number | null;
  totalPoints: number | null;
  totalMembers: number | null;  // ADD THIS
  ok: boolean;
  source: "live" | "unconfigured" | "error";
};

/** Live AAR bot stats (Railway). Override with DROPSHIP_STATS_URL if it changes. */
const DEFAULT_DROPSHIP_STATS_URL =
  "https://1st-mi-aar-production-1522.up.railway.app/stats";

/**
 * Proxy the Discord AAR bot stats API so the browser never needs CORS
 * and the bot URL stays server-side.
 *
 * Optional override on Vercel / host:
 *   DROPSHIP_STATS_URL=https://your-bot-host.example.com/stats
 *
 * Bot GET /stats → { totalDropships, totalPoints }
 */
export const fetchDropshipStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DropshipStats> => {
    const url =
      process.env.DROPSHIP_STATS_URL?.trim() ||
      process.env.VITE_DROPSHIP_STATS_URL?.trim() ||
      DEFAULT_DROPSHIP_STATS_URL;

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
        signal: AbortSignal.timeout(6_000),
        cache: "no-store",
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
        totalOperations?: number;
        totalMembers?: number;
      };
      
      const totalDropships = Number(
        data.totalDropships ?? data.totalOperations ?? NaN,
      );
      const totalPoints = Number(data.totalPoints ?? NaN);
      const totalMembers = Number(data.totalMembers ?? NaN);
      
      return {
        totalDropships: Number.isFinite(totalDropships) ? totalDropships : null,
        totalPoints: Number.isFinite(totalPoints) ? totalPoints : null,
        totalMembers: Number.isFinite(totalMembers) ? totalMembers : null,
        ok: Number.isFinite(totalDropships) || Number.isFinite(totalMembers),
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
