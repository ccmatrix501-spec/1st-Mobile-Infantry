/** Shared WebSocket path for the bugs-killed live feed. */
export const BUGS_KILLED_WS_PATH = "/ws/bugs-killed";

export type BugsKilledWsMessage =
  | {
      type: "hello";
      count: number;
      serverTime: number;
    }
  | {
      type: "tick";
      count: number;
      serverTime: number;
    }
  | {
      type: "pong";
      serverTime: number;
    };

export type BugsKilledWsClientMessage =
  | { type: "ping"; clientTime: number }
  | { type: "subscribe" };
