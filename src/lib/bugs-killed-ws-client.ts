import {
  BUGS_KILLED_WS_PATH,
  type BugsKilledWsMessage,
} from "@/lib/bugs-killed-protocol";

export type BugsKilledLiveState = {
  count: number;
  serverTime: number;
  /** Wall clock offset: serverTime ≈ Date.now() + offsetMs */
  offsetMs: number;
  connected: boolean;
  source: "ws" | "fallback";
};

function wsUrl(): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${BUGS_KILLED_WS_PATH}`;
}

/**
 * Connect to the bugs-killed WebSocket feed. Calls `onUpdate` on every tick.
 * Auto-reconnects with backoff. Returns a dispose function.
 */
export function connectBugsKilledWs(
  onUpdate: (state: BugsKilledLiveState) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let retryMs = 500;
  let retryTimer: number | undefined;
  let pingTimer: number | undefined;

  const cleanupSocket = () => {
    if (pingTimer !== undefined) {
      window.clearInterval(pingTimer);
      pingTimer = undefined;
    }
    if (ws) {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
    }
  };

  const applyMessage = (msg: BugsKilledWsMessage) => {
    if (msg.type === "hello" || msg.type === "tick") {
      const clientNow = Date.now();
      onUpdate({
        count: msg.count,
        serverTime: msg.serverTime,
        offsetMs: msg.serverTime - clientNow,
        connected: true,
        source: "ws",
      });
    } else if (msg.type === "pong") {
      const clientNow = Date.now();
      onUpdate({
        count: -1, // signal: time-only update
        serverTime: msg.serverTime,
        offsetMs: msg.serverTime - clientNow,
        connected: true,
        source: "ws",
      });
    }
  };

  const connect = () => {
    if (closed) return;
    cleanupSocket();
    try {
      ws = new WebSocket(wsUrl());
    } catch {
      scheduleRetry();
      return;
    }

    ws.onopen = () => {
      retryMs = 500;
      onStatus?.(true);
      try {
        ws?.send(JSON.stringify({ type: "subscribe" }));
      } catch {
        /* ignore */
      }
      pingTimer = window.setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping", clientTime: Date.now() }));
        }
      }, 25_000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as BugsKilledWsMessage;
        applyMessage(msg);
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {
      // close will fire next
    };

    ws.onclose = () => {
      onStatus?.(false);
      cleanupSocket();
      scheduleRetry();
    };
  };

  const scheduleRetry = () => {
    if (closed) return;
    if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => {
      retryTimer = undefined;
      connect();
    }, retryMs);
    retryMs = Math.min(retryMs * 1.6, 8_000);
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    cleanupSocket();
  };
}
